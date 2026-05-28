# Performance Wave 3 — Push Notification Dispatcher Batching Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Cut Edge Function invocations ≥50% and Expo Push API calls ≥90% by replacing per-notification dispatch with a cron-driven batch processor. Fix the per-minute coalesce key. Move bad-token DELETE into one batched query.

**Architecture:** Today every `notifications_outbox` INSERT triggers a webhook → one `dispatch-notification` invocation → one Expo HTTP call. New:
- `pg_cron` runs every 5s, calls a new function `dispatch-notifications-batch` via `net.http_post`.
- Batch function: `SELECT … FOR UPDATE SKIP LOCKED LIMIT 100`, sends in one Expo call (100 messages/request), accumulates bad tokens, one final `DELETE … WHERE push_token IN (…)`.
- High-urgency rows (`urgency='high'`) keep immediate per-INSERT path. Everything else → batch.

**Spec mapping:** § Wave 3.

**Depends on:** Wave 0 merged (we use `withTiming` to log batch sizes).

**SSOT:** Add PERF-4 to BACKLOG. Close/narrow TD-92.

---

## File Structure

| File | Status | Responsibility |
| --- | --- | --- |
| `supabase/functions/dispatch-notifications-batch/index.ts` | Create | New batch processor (uses `withTiming` from Wave 0) |
| `supabase/functions/_shared/expoPush.ts` | Create | Extracted pure `sendExpoPush(messages[])` helper |
| `supabase/functions/dispatch-notification/index.ts` | Modify | Keep for `urgency='high'` only; refactor to use shared helper. Coalesce key fix lands here. |
| `supabase/migrations/<n>_notifications_batch_rpcs.sql` | Create | `claim_batch` / `release_claim` / `mark_sent` RPCs |
| `supabase/migrations/<n>_notifications_batch_cron.sql` | Create | pg_cron schedule every 5s |
| `app/packages/infrastructure-supabase/src/__tests__/expoPush.test.ts` | Create | Unit test for batching helper (mocked fetch) |
| `app/packages/infrastructure-supabase/src/__tests__/sqlProbes.integration.test.ts` | Modify | Probe: 10 outbox rows → batch fn drains them all |

---

## Pre-flight

- [ ] Waves 0–2 merged.
- [ ] `git switch dev && git pull --ff-only && git switch -c feat/PERF-4-dispatcher-batching-be`.
- [ ] Read current `dispatch-notification/index.ts` end-to-end. Understand outbox row schema, coalesce key construction, Expo error handling, `inject_system_message` flow.

---

## Section A — Extract `sendExpoPush`

Create `supabase/functions/_shared/expoPush.ts`:

```typescript
export type ExpoPushMessage = {
  to: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
};

export type ExpoPushTicket =
  | { status: 'ok'; id: string }
  | { status: 'error'; message: string; details?: { error?: string } };

const EXPO_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_LIMIT = 100;

export async function sendExpoPush(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) return [];
  if (messages.length > BATCH_LIMIT) {
    const out: ExpoPushTicket[] = [];
    for (let i = 0; i < messages.length; i += BATCH_LIMIT) {
      const tickets = await sendExpoPush(messages.slice(i, i + BATCH_LIMIT));
      out.push(...tickets);
    }
    return out;
  }
  const res = await fetch(EXPO_URL, {
    method: 'POST',
    headers: { 'accept': 'application/json', 'accept-encoding': 'gzip, deflate', 'content-type': 'application/json' },
    body: JSON.stringify(messages),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Expo push HTTP ${res.status}: ${text}`);
  }
  const json = (await res.json()) as { data?: ExpoPushTicket[] };
  return json.data ?? [];
}
```

Replace inline Expo call in `dispatch-notification/index.ts` with `import { sendExpoPush } from '../_shared/expoPush.ts'`. Commit `refactor(notifications): extract sendExpoPush to _shared (PERF-4)`.

Test `app/packages/infrastructure-supabase/src/__tests__/expoPush.test.ts`:

```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { sendExpoPush } from '../../../../../supabase/functions/_shared/expoPush.ts';

describe('sendExpoPush', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('batches up to 100 per HTTP call', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );
    const msgs = Array.from({ length: 250 }, (_, i) => ({ to: `t${i}`, body: 'b' }));
    await sendExpoPush(msgs);
    expect(fetchMock).toHaveBeenCalledTimes(3); // 100 + 100 + 50
  });

  it('empty input → empty output, no fetch', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    expect(await sendExpoPush([])).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws on non-OK HTTP', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('rate limited', { status: 429 }));
    await expect(sendExpoPush([{ to: 't1', body: 'b' }])).rejects.toThrow(/429/);
  });
});
```

PASS; commit `test(notifications): sendExpoPush batching + error tests (PERF-4)`.

---

## Section B — Batch processor

### B1: New Edge Function

`supabase/functions/dispatch-notifications-batch/index.ts`:

```typescript
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { sendExpoPush, type ExpoPushMessage, type ExpoPushTicket } from '../_shared/expoPush.ts';
import { withTiming } from '../_shared/withTiming.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const handler = async (_req: Request): Promise<Response> => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: rows, error: claimErr } = await supabase
    .rpc('notifications_outbox_claim_batch', { p_limit: 100 });
  if (claimErr) return new Response(JSON.stringify({ error: claimErr.message }), { status: 500 });
  if (!rows || rows.length === 0) return new Response(JSON.stringify({ drained: 0 }), { status: 200 });

  const messages: ExpoPushMessage[] = rows.map((r: { push_token: string; title: string | null; body: string | null; data: Record<string, unknown> | null }) => ({
    to: r.push_token,
    title: r.title ?? undefined,
    body: r.body ?? undefined,
    data: r.data ?? undefined,
    sound: 'default',
    channelId: 'default',
  }));

  let tickets: ExpoPushTicket[];
  try {
    tickets = await sendExpoPush(messages);
  } catch (err) {
    await supabase.rpc('notifications_outbox_release_claim', { p_ids: rows.map((r: { id: string }) => r.id) });
    return new Response(JSON.stringify({ error: String(err) }), { status: 502 });
  }

  const sentIds: string[] = [];
  const badTokens: string[] = [];
  rows.forEach((r: { id: string; push_token: string }, i: number) => {
    const t = tickets[i];
    if (t?.status === 'ok') { sentIds.push(r.id); }
    else if (t?.status === 'error' && t.details?.error === 'DeviceNotRegistered') {
      badTokens.push(r.push_token);
      sentIds.push(r.id); // don't retry on dead token
    }
    // other error reasons: leave row, claim expiry returns it for retry.
  });

  if (sentIds.length > 0) await supabase.rpc('notifications_outbox_mark_sent', { p_ids: sentIds });
  if (badTokens.length > 0) await supabase.from('devices').delete().in('push_token', badTokens);

  return new Response(
    JSON.stringify({ drained: rows.length, sent: sentIds.length - badTokens.length, bad: badTokens.length }),
    { status: 200 },
  );
};

Deno.serve(withTiming('dispatch-notifications-batch', handler));
```

Commit `feat(notifications): cron-driven batch processor for outbox (PERF-4)`.

### B2: Supporting RPCs

Migration `<n>_notifications_batch_rpcs.sql`:

```sql
create or replace function public.notifications_outbox_claim_batch(p_limit int)
returns table (id uuid, push_token text, title text, body text, data jsonb)
language plpgsql security definer set search_path = public
as $$
begin
  return query
  with locked as (
    select o.id from notifications_outbox o
    where o.sent_at is null
      and (o.locked_until is null or o.locked_until < now())
      and (o.urgency is null or o.urgency <> 'high')
    order by o.created_at
    for update skip locked
    limit p_limit
  )
  update notifications_outbox o
  set locked_until = now() + interval '60 seconds'
  from locked where o.id = locked.id
  returning o.id, o.push_token, o.title, o.body, o.data;
end; $$;

create or replace function public.notifications_outbox_release_claim(p_ids uuid[])
returns void language sql security definer set search_path = public as $$
  update notifications_outbox set locked_until = null where id = any(p_ids);
$$;

create or replace function public.notifications_outbox_mark_sent(p_ids uuid[])
returns void language sql security definer set search_path = public as $$
  update notifications_outbox set sent_at = now(), locked_until = null where id = any(p_ids);
$$;

revoke all on function public.notifications_outbox_claim_batch from public;
revoke all on function public.notifications_outbox_release_claim from public;
revoke all on function public.notifications_outbox_mark_sent from public;
grant execute on function public.notifications_outbox_claim_batch to service_role;
grant execute on function public.notifications_outbox_release_claim to service_role;
grant execute on function public.notifications_outbox_mark_sent to service_role;
```

Verify outbox column names against the table-creation migration. Apply via MCP. Smoke: insert 5 rows, call `claim_batch(3)`, verify 3 returned + locked; release; verify unlocked. Cleanup test rows.

Commit `feat(db): claim/release/mark-sent RPCs for outbox batching (PERF-4)`.

### B3: Cron schedule

Migration `<n>_notifications_batch_cron.sql`:

```sql
select cron.schedule(
  'drain-notifications-outbox',
  '*/5 * * * * *',
  $$
    select net.http_post(
      url := current_setting('app.functions_url') || '/dispatch-notifications-batch',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.functions_anon_key')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 4000
    );
  $$
);
```

The `app.functions_url` / `app.functions_anon_key` GUCs must be set. Inspect existing post-expiry cron pattern for how this is configured in this project — follow it. If different (vault secret, hardcoded URL), adapt.

Apply via MCP. Verify: `select * from cron.job where jobname = 'drain-notifications-outbox';` → one row, `active = true`.

After ~30s, read function logs via MCP `get_logs` — every 5s, a `withTiming` line `{fn:"dispatch-notifications-batch", invocation_ms:N, drained:0, ...}` (zero until real notifications flow).

Commit `feat(notifications): pg_cron schedule for batch drain every 5s (PERF-4)`.

---

## Section C — Coalesce key fix

In `supabase/functions/dispatch-notification/index.ts`, find dedupe-key construction. Replace per-minute with 5-minute window:

```typescript
const now = new Date();
const windowMs = 5 * 60_000;
const windowKey = Math.floor(now.getTime() / windowMs);
const dedupeKey = `chat:${chatId}:${viewerId}:5m-${windowKey}`;
```

The `viewerId` (recipient) is the scope, not `senderId` — we want "X new messages from chat Y for viewer Z", not "Y sent N messages".

Verify the consuming coalescer count-by-dedupe path produces the "X new messages" body when count > 1. Commit `fix(notifications): widen chat dedupe key to 5-min window (PERF-4, TD-92)`.

---

## Section D — SSOT + PR

Re-read TD-92 sub-bullets. Closed by this wave: per-minute chat dedupe key. Not in scope: post-expiry cron catch-up window; last_seen_at AppState touchpoint; outbox TTL releasing dedupe constraint. Narrow TD-92 to remaining sub-bullets, or delete if all are addressed.

Add PERF-4 to BACKLOG.md under P2 (notifications):

```
| PERF-4 | Performance Wave 3 — push batch dispatcher + Expo 100-batch + 5min chat coalesce + batched bad-token DELETE | agent-be | ✅ Done | `docs/superpowers/specs/2026-05-25-app-performance-overhaul-design.md` § Wave 3; `docs/superpowers/plans/2026-05-25-perf-wave-3-dispatcher.md` |
```

Commit `docs(ssot): close/narrow TD-92, add PERF-4`.

### Load test

```sql
insert into notifications_outbox (push_token, title, body, data, urgency)
select 'ExponentPushToken[fake_' || gs::text || ']', 'msg', 'body ' || gs::text, '{}', null
from generate_series(1, 50) gs;
```

Wait 10s. `select count(*) from notifications_outbox where sent_at is not null;` → close to 50. `bad` count ~50 in withTiming logs (fake tokens trigger DeviceNotRegistered) and was a single DELETE.

After 24h dev traffic: `dispatch-notifications-batch` p50 ≤ 80ms; original `dispatch-notification` invocations drop ≥50%.

### Push + PR

```bash
git push -u origin feat/PERF-4-dispatcher-batching-be
gh pr create --base dev --head feat/PERF-4-dispatcher-batching-be \
  --title "perf(notifications): batch dispatcher + Expo-100 + 5min coalesce (PERF-4)" \
  --body "..." --label "PERF" --assignee "@me"
gh pr merge --auto --squash --delete-branch
```
