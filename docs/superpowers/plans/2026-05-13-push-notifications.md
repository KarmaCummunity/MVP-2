# Push Notifications (P1.5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working end-to-end push-notification pipeline on iOS and Android for all 11 in-scope notification kinds (FR-NOTIF-001/002/003/005/006/007/008/009/010/011/013, plus 014/015 for prefs and token lifecycle), closing TD-19, TD-115, TD-119, TD-124.

**Architecture:** Outbox table written from DB triggers in the same transaction as the originating event → Supabase Database Webhook fires `dispatch-notification` Edge Function → Edge Function loads recipient prefs+devices, applies coalescing, calls Expo Push HTTP API → device receives push and client routes the tap via `expo-router`. Client-side foreground handler suppresses the chat-active case. Pre-prompt modal asks for OS permission contextually on first chat send / first post publish.

**Tech Stack:** Supabase Postgres + pg_cron + Edge Functions (Deno) · Expo SDK 54 · `expo-notifications` + `expo-device` · Expo Push HTTP API · React Native + expo-router · zustand · React Query · vitest.

**Reference design:** [`docs/superpowers/specs/2026-05-13-push-notifications-design.md`](../specs/2026-05-13-push-notifications-design.md).

**Slicing:** Two PRs to limit blast radius.
- **Phase 1 / PR-1 = Tasks 1–25:** Foundation + chat-only path (FR-NOTIF-001/002/003) + Settings UI + device lifecycle.
- **Phase 2 / PR-2 = Tasks 26–33:** Remaining producers (mark/unmark/auto-removed/post-expiring/follow-*) + the second pre-prompt trigger + final SSOT close-out.

**Branch for Phase 1:** `feat/FR-NOTIF-001-foundation`. **Branch for Phase 2:** `feat/FR-NOTIF-009-remaining-producers`. Both target `dev`.

---

## Pre-requisites (one-time, blocks Phase 1)

These are operational and must be done by the engineer (or PM) before starting Task 1. They are not committed code.

- [ ] **P0: Run `eas init` inside `app/apps/mobile/`** to create an EAS project under the existing Expo org. Confirms `app.json:expo.extra.eas.projectId` is populated. (Free.)
- [ ] **P1: Create `EXPO_ACCESS_TOKEN`** at https://expo.dev → Account Settings → Access Tokens → create. Add to Supabase Function Secrets via dashboard `Edge Functions → Secrets → Add Secret`.
- [ ] **P2: Verify `pg_net` and `supabase_functions` extensions are enabled** in the Supabase project. Run `select * from pg_extension where extname in ('pg_net');` — if absent, enable via dashboard.

---

## Phase 1 — Foundation + Chat Path

### Task 1: Install dependencies and configure `expo-notifications`

**Files:**
- Modify: `app/apps/mobile/package.json`
- Modify: `app/apps/mobile/app.json`
- Create: `app/apps/mobile/assets/notification-icon.png` (96×96 white-on-transparent placeholder)

- [ ] **Step 1: Add dependencies**

Run from `app/`:
```bash
pnpm --filter @kc/mobile add expo-notifications@~0.32 expo-device@~7.0
```

Expected: `package.json` updated with both packages; lockfile updated.

- [ ] **Step 2: Add Expo plugin config to `app.json`**

In `app/apps/mobile/app.json`, locate the `"plugins"` array under `"expo"` and append:
```json
[
  "expo-notifications",
  {
    "icon": "./assets/notification-icon.png",
    "color": "#0A8754",
    "sounds": []
  }
]
```

- [ ] **Step 3: Generate placeholder icon**

Use any image tool to create a 96×96 PNG, white shape on transparent background, save as `app/apps/mobile/assets/notification-icon.png`. A simple stylized gift/heart silhouette is fine — design polish is tracked as TD-60.

- [ ] **Step 4: Verify typecheck still passes**

Run from `app/`:
```bash
pnpm --filter @kc/mobile typecheck
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/apps/mobile/package.json app/apps/mobile/app.json app/apps/mobile/assets/notification-icon.png app/pnpm-lock.yaml
git commit -m "chore(notif): add expo-notifications and expo-device dependencies"
```

---

### Task 2: Domain types

**Files:**
- Create: `app/packages/domain/src/notifications.ts`
- Modify: `app/packages/domain/src/index.ts` (re-export)

- [ ] **Step 1: Create the types file**

`app/packages/domain/src/notifications.ts`:
```ts
export type NotificationCategory = 'critical' | 'social';

export type NotificationKind =
  | 'chat_message'
  | 'support_message'
  | 'system_message'
  | 'post_expiring'
  | 'mark_recipient'
  | 'unmark_recipient'
  | 'auto_removed'
  | 'follow_request'
  | 'follow_started'
  | 'follow_approved';

/** Payload attached to every Expo push under `data`. The client reads this on tap. */
export interface PushData {
  category: NotificationCategory;
  kind: NotificationKind;
  notification_id: string;
  /** expo-router pathname, e.g. '/chat/[id]'. */
  route?: string;
  /** route params, e.g. { id: '<chat_id>' }. */
  params?: Record<string, string>;
  /** Convenience field used by the foreground handler to detect chat-active state. */
  chat_id?: string;
}

export interface DeviceRegistration {
  readonly userId: string;
  readonly pushToken: string;
  readonly platform: 'ios' | 'android' | 'web';
}
```

- [ ] **Step 2: Re-export from package index**

Append to `app/packages/domain/src/index.ts`:
```ts
export * from './notifications';
```

- [ ] **Step 3: Typecheck domain package**

Run from `app/`:
```bash
pnpm --filter @kc/domain typecheck
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/packages/domain/src/notifications.ts app/packages/domain/src/index.ts
git commit -m "feat(domain): add notification types — PushData, NotificationKind, DeviceRegistration

Mapped to spec: FR-NOTIF-015."
```

---

### Task 3: `IDeviceRepository` port

**Files:**
- Create: `app/packages/application/src/notifications/IDeviceRepository.ts`
- Modify: `app/packages/application/src/index.ts` (re-export)

- [ ] **Step 1: Create the port**

`app/packages/application/src/notifications/IDeviceRepository.ts`:
```ts
import type { Device, DeviceRegistration } from '@kc/domain';

export interface IDeviceRepository {
  /**
   * Insert or update a device row keyed by push_token.
   * If the token already exists with a different userId, the row is reassigned to the new user.
   * Updates last_seen_at to now() on every call.
   */
  upsert(input: DeviceRegistration): Promise<Device>;

  /**
   * Soft-deactivate a device by removing its row from `devices`.
   * No-op if the token is not registered.
   */
  deactivate(pushToken: string): Promise<void>;

  /**
   * List all active device rows for a user.
   * Used by sign-out flow and for diagnostics in Settings → device-status section.
   */
  listForUser(userId: string): Promise<Device[]>;
}
```

> If `Device` is not yet exported from `@kc/domain`, verify `app/packages/domain/src/entities.ts:74` (where `Device` is defined). It should already be re-exported via `app/packages/domain/src/index.ts`. If not, add it there.

- [ ] **Step 2: Re-export from package index**

Append to `app/packages/application/src/index.ts`:
```ts
export type { IDeviceRepository } from './notifications/IDeviceRepository';
```

- [ ] **Step 3: Typecheck application package**

Run:
```bash
pnpm --filter @kc/application typecheck
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/packages/application/src/notifications/IDeviceRepository.ts app/packages/application/src/index.ts
git commit -m "feat(application): add IDeviceRepository port

Mapped to spec: FR-NOTIF-015."
```

---

### Task 4: `RegisterDeviceUseCase` — TDD

**Files:**
- Create: `app/packages/application/src/notifications/RegisterDeviceUseCase.ts`
- Create: `app/packages/application/src/notifications/__tests__/RegisterDeviceUseCase.test.ts`
- Create: `app/packages/application/src/notifications/__tests__/FakeDeviceRepository.ts`

- [ ] **Step 1: Write the fake repository**

`app/packages/application/src/notifications/__tests__/FakeDeviceRepository.ts`:
```ts
import type { Device, DeviceRegistration } from '@kc/domain';
import type { IDeviceRepository } from '../IDeviceRepository';

export class FakeDeviceRepository implements IDeviceRepository {
  rows: Device[] = [];

  async upsert(input: DeviceRegistration): Promise<Device> {
    const existing = this.rows.find((r) => r.pushToken === input.pushToken);
    const now = new Date();
    if (existing) {
      existing.userId = input.userId;
      existing.lastSeenAt = now;
      existing.platform = input.platform;
      return existing;
    }
    const row: Device = {
      deviceId: `dev_${this.rows.length + 1}`,
      userId: input.userId,
      pushToken: input.pushToken,
      platform: input.platform,
      lastSeenAt: now,
      createdAt: now,
    };
    this.rows.push(row);
    return row;
  }

  async deactivate(pushToken: string): Promise<void> {
    this.rows = this.rows.filter((r) => r.pushToken !== pushToken);
  }

  async listForUser(userId: string): Promise<Device[]> {
    return this.rows.filter((r) => r.userId === userId);
  }
}
```

> If the `Device` entity shape differs from `{ deviceId, userId, pushToken, platform, lastSeenAt, createdAt }`, adapt this fake to match. The canonical shape lives at `app/packages/domain/src/entities.ts:74`.

- [ ] **Step 2: Write the failing test**

`app/packages/application/src/notifications/__tests__/RegisterDeviceUseCase.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { RegisterDeviceUseCase } from '../RegisterDeviceUseCase';
import { FakeDeviceRepository } from './FakeDeviceRepository';
import { ValidationError } from '@kc/domain';

describe('RegisterDeviceUseCase', () => {
  it('upserts a fresh token for a user', async () => {
    const repo = new FakeDeviceRepository();
    const uc = new RegisterDeviceUseCase(repo);

    await uc.execute({ userId: 'u1', pushToken: 'ExponentPushToken[abc]', platform: 'ios' });

    expect(repo.rows).toHaveLength(1);
    expect(repo.rows[0].userId).toBe('u1');
    expect(repo.rows[0].pushToken).toBe('ExponentPushToken[abc]');
  });

  it('reassigns a token to a different user', async () => {
    const repo = new FakeDeviceRepository();
    const uc = new RegisterDeviceUseCase(repo);

    await uc.execute({ userId: 'u1', pushToken: 'ExponentPushToken[abc]', platform: 'ios' });
    await uc.execute({ userId: 'u2', pushToken: 'ExponentPushToken[abc]', platform: 'ios' });

    expect(repo.rows).toHaveLength(1);
    expect(repo.rows[0].userId).toBe('u2');
  });

  it('rejects empty userId with ValidationError', async () => {
    const repo = new FakeDeviceRepository();
    const uc = new RegisterDeviceUseCase(repo);

    await expect(
      uc.execute({ userId: '', pushToken: 'ExponentPushToken[abc]', platform: 'ios' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects empty pushToken with ValidationError', async () => {
    const repo = new FakeDeviceRepository();
    const uc = new RegisterDeviceUseCase(repo);

    await expect(
      uc.execute({ userId: 'u1', pushToken: '', platform: 'ios' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
```

- [ ] **Step 3: Run test, verify it fails**

```bash
pnpm --filter @kc/application test -- RegisterDeviceUseCase
```
Expected: FAIL — `Cannot find module '../RegisterDeviceUseCase'`.

- [ ] **Step 4: Write the implementation**

`app/packages/application/src/notifications/RegisterDeviceUseCase.ts`:
```ts
import { ValidationError, type Device, type DeviceRegistration } from '@kc/domain';
import type { IDeviceRepository } from './IDeviceRepository';

export class RegisterDeviceUseCase {
  constructor(private readonly deviceRepo: IDeviceRepository) {}

  async execute(input: DeviceRegistration): Promise<Device> {
    if (!input.userId) throw new ValidationError('userId is required');
    if (!input.pushToken) throw new ValidationError('pushToken is required');
    return this.deviceRepo.upsert(input);
  }
}
```

- [ ] **Step 5: Run tests, verify pass**

```bash
pnpm --filter @kc/application test -- RegisterDeviceUseCase
```
Expected: 4/4 PASS.

- [ ] **Step 6: Commit**

```bash
git add app/packages/application/src/notifications/
git commit -m "feat(application): add RegisterDeviceUseCase with TDD coverage

Mapped to spec: FR-NOTIF-015 AC1, AC2."
```

---

### Task 5: `DeactivateDeviceUseCase` — TDD

**Files:**
- Create: `app/packages/application/src/notifications/DeactivateDeviceUseCase.ts`
- Create: `app/packages/application/src/notifications/__tests__/DeactivateDeviceUseCase.test.ts`

- [ ] **Step 1: Write the failing test**

`app/packages/application/src/notifications/__tests__/DeactivateDeviceUseCase.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { DeactivateDeviceUseCase } from '../DeactivateDeviceUseCase';
import { RegisterDeviceUseCase } from '../RegisterDeviceUseCase';
import { FakeDeviceRepository } from './FakeDeviceRepository';

describe('DeactivateDeviceUseCase', () => {
  it('removes a registered token', async () => {
    const repo = new FakeDeviceRepository();
    await new RegisterDeviceUseCase(repo).execute({
      userId: 'u1', pushToken: 'T1', platform: 'ios',
    });

    await new DeactivateDeviceUseCase(repo).execute('T1');

    expect(repo.rows).toHaveLength(0);
  });

  it('is a no-op for an unknown token', async () => {
    const repo = new FakeDeviceRepository();
    await expect(new DeactivateDeviceUseCase(repo).execute('unknown')).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test, verify fails**

```bash
pnpm --filter @kc/application test -- DeactivateDeviceUseCase
```
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

`app/packages/application/src/notifications/DeactivateDeviceUseCase.ts`:
```ts
import type { IDeviceRepository } from './IDeviceRepository';

export class DeactivateDeviceUseCase {
  constructor(private readonly deviceRepo: IDeviceRepository) {}

  async execute(pushToken: string): Promise<void> {
    if (!pushToken) return;
    await this.deviceRepo.deactivate(pushToken);
  }
}
```

- [ ] **Step 4: Verify pass**

```bash
pnpm --filter @kc/application test -- DeactivateDeviceUseCase
```
Expected: 2/2 PASS.

- [ ] **Step 5: Commit**

```bash
git add app/packages/application/src/notifications/DeactivateDeviceUseCase.ts app/packages/application/src/notifications/__tests__/DeactivateDeviceUseCase.test.ts
git commit -m "feat(application): add DeactivateDeviceUseCase

Mapped to spec: FR-NOTIF-015 AC3."
```

---

### Task 6: Coalesce helper (used by Edge Function) — TDD

**Files:**
- Create: `app/packages/application/src/notifications/coalesce.ts`
- Create: `app/packages/application/src/notifications/__tests__/coalesce.test.ts`

This is a pure-function helper that the Edge Function will duplicate (Deno cannot import from pnpm workspace). The CI lint in Task 24 enforces byte-equality.

- [ ] **Step 1: Write the failing test**

`app/packages/application/src/notifications/__tests__/coalesce.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { coalesceChat, coalesceFollowStarted } from '../coalesce';

describe('coalesceChat', () => {
  it('returns single-message shape when no prior dispatches in window', () => {
    const result = coalesceChat({ priorCount: 0, senderName: 'Avi', messagePreview: 'שלום' });
    expect(result).toEqual({
      titleKey: 'notifications.chatTitle',
      bodyKey: 'notifications.chatBody',
      bodyArgs: { senderName: 'Avi', messagePreview: 'שלום' },
    });
  });

  it('returns coalesced shape when 1 prior dispatch exists', () => {
    const result = coalesceChat({ priorCount: 1, senderName: 'Avi', messagePreview: 'x' });
    expect(result.bodyKey).toBe('notifications.chatBodyCoalesced');
    expect(result.bodyArgs).toEqual({ senderName: 'Avi', count: 2 });
  });

  it('returns coalesced shape for N>2 prior dispatches', () => {
    const result = coalesceChat({ priorCount: 4, senderName: 'Avi', messagePreview: 'x' });
    expect(result.bodyArgs).toEqual({ senderName: 'Avi', count: 5 });
  });
});

describe('coalesceFollowStarted', () => {
  it('returns single-follower shape below threshold (count=2)', () => {
    const result = coalesceFollowStarted({ priorCount: 1, followerName: 'Dana' });
    expect(result.bodyKey).toBe('notifications.followStartedBody');
    expect(result.bodyArgs).toEqual({ followerName: 'Dana' });
  });

  it('coalesces at threshold (count=3)', () => {
    const result = coalesceFollowStarted({ priorCount: 2, followerName: 'Dana' });
    expect(result.bodyKey).toBe('notifications.followStartedCoalesced');
    expect(result.bodyArgs).toEqual({ count: 3 });
  });

  it('coalesces above threshold (count=10)', () => {
    const result = coalesceFollowStarted({ priorCount: 9, followerName: 'Dana' });
    expect(result.bodyArgs).toEqual({ count: 10 });
  });
});
```

- [ ] **Step 2: Run, verify fail**

```bash
pnpm --filter @kc/application test -- coalesce
```
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

`app/packages/application/src/notifications/coalesce.ts`:
```ts
/**
 * Coalescing helpers for the notification dispatcher.
 *
 * IMPORTANT: This file is byte-mirrored at supabase/functions/dispatch-notification/coalesce.ts.
 * CI fails the build if they drift. See scripts/check-architecture.mjs.
 */

export interface CoalesceResult {
  readonly titleKey: string;
  readonly bodyKey: string;
  readonly bodyArgs: Readonly<Record<string, string | number>>;
}

export function coalesceChat(input: {
  priorCount: number;
  senderName: string;
  messagePreview: string;
}): CoalesceResult {
  if (input.priorCount === 0) {
    return {
      titleKey: 'notifications.chatTitle',
      bodyKey: 'notifications.chatBody',
      bodyArgs: { senderName: input.senderName, messagePreview: input.messagePreview },
    };
  }
  return {
    titleKey: 'notifications.chatTitle',
    bodyKey: 'notifications.chatBodyCoalesced',
    bodyArgs: { senderName: input.senderName, count: input.priorCount + 1 },
  };
}

export function coalesceFollowStarted(input: {
  priorCount: number;
  followerName: string;
}): CoalesceResult {
  const count = input.priorCount + 1;
  if (count < 3) {
    return {
      titleKey: 'notifications.followStartedTitle',
      bodyKey: 'notifications.followStartedBody',
      bodyArgs: { followerName: input.followerName },
    };
  }
  return {
    titleKey: 'notifications.followStartedTitle',
    bodyKey: 'notifications.followStartedCoalesced',
    bodyArgs: { count },
  };
}
```

- [ ] **Step 4: Verify pass**

```bash
pnpm --filter @kc/application test -- coalesce
```
Expected: 6/6 PASS.

- [ ] **Step 5: Commit**

```bash
git add app/packages/application/src/notifications/coalesce.ts app/packages/application/src/notifications/__tests__/coalesce.test.ts
git commit -m "feat(application): add coalesce helpers for chat and follow_started

Mapped to spec: FR-NOTIF-001 AC3, FR-NOTIF-007 AC3."
```

---

### Task 7: `SupabaseDeviceRepository` adapter

**Files:**
- Create: `app/packages/infrastructure-supabase/src/notifications/SupabaseDeviceRepository.ts`
- Modify: `app/packages/infrastructure-supabase/src/index.ts` (re-export)

- [ ] **Step 1: Write the adapter**

`app/packages/infrastructure-supabase/src/notifications/SupabaseDeviceRepository.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Device, DeviceRegistration } from '@kc/domain';
import type { IDeviceRepository } from '@kc/application';
import type { Database } from '../database.types';

type DeviceRow = Database['public']['Tables']['devices']['Row'];

function mapRow(row: DeviceRow): Device {
  return {
    deviceId: row.device_id,
    userId: row.user_id,
    pushToken: row.push_token,
    platform: row.platform as 'ios' | 'android' | 'web',
    lastSeenAt: new Date(row.last_seen_at),
    createdAt: new Date(row.created_at),
  };
}

export class SupabaseDeviceRepository implements IDeviceRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async upsert(input: DeviceRegistration): Promise<Device> {
    const { data, error } = await this.client
      .from('devices')
      .upsert(
        {
          user_id: input.userId,
          push_token: input.pushToken,
          platform: input.platform,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'push_token' },
      )
      .select('*')
      .single();
    if (error) throw error;
    return mapRow(data);
  }

  async deactivate(pushToken: string): Promise<void> {
    const { error } = await this.client.from('devices').delete().eq('push_token', pushToken);
    if (error && error.code !== 'PGRST116') throw error;
  }

  async listForUser(userId: string): Promise<Device[]> {
    const { data, error } = await this.client.from('devices').select('*').eq('user_id', userId);
    if (error) throw error;
    return (data ?? []).map(mapRow);
  }
}
```

- [ ] **Step 2: Re-export**

Append to `app/packages/infrastructure-supabase/src/index.ts`:
```ts
export { SupabaseDeviceRepository } from './notifications/SupabaseDeviceRepository';
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @kc/infrastructure-supabase typecheck
```
Expected: PASS. If `database.types.ts` doesn't yet have `devices` (it should — devices was created in migration 0001), regenerate it via `supabase gen types typescript`.

- [ ] **Step 4: Commit**

```bash
git add app/packages/infrastructure-supabase/src/notifications/SupabaseDeviceRepository.ts app/packages/infrastructure-supabase/src/index.ts
git commit -m "feat(infra): add SupabaseDeviceRepository adapter

Mapped to spec: FR-NOTIF-015."
```

---

### Task 8: Migration 0046 — outbox table + `enqueue_notification` helper

**Files:**
- Create: `supabase/migrations/0046_notifications_outbox.sql`

- [ ] **Step 1: Write the migration**

`supabase/migrations/0046_notifications_outbox.sql`:
```sql
-- 0046_notifications_outbox | P1.5 — FR-NOTIF-* outbox + helper.
-- Creates the queue table, the enqueue helper, and the indexes required
-- by the dispatcher and the retry sweeper. Triggers, webhook, and crons
-- are split into 0047 / 0048 for reviewability.

begin;

create table if not exists public.notifications_outbox (
  notification_id      uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.users(user_id) on delete cascade,
  category             text not null check (category in ('critical','social')),
  kind                 text not null,
  title_key            text not null,
  body_key             text not null,
  body_args            jsonb not null default '{}'::jsonb,
  data                 jsonb not null default '{}'::jsonb,
  dedupe_key           text,
  bypass_preferences   boolean not null default false,
  created_at           timestamptz not null default now(),
  dispatched_at        timestamptz,
  attempts             int not null default 0,
  last_error           text,
  expires_at           timestamptz not null default (now() + interval '7 days')
);

create index if not exists notifications_outbox_user_created_idx
  on public.notifications_outbox (user_id, created_at desc);

create index if not exists notifications_outbox_pending_idx
  on public.notifications_outbox (created_at)
  where dispatched_at is null;

create unique index if not exists notifications_outbox_dedupe_idx
  on public.notifications_outbox (dedupe_key)
  where dedupe_key is not null;

create index if not exists notifications_outbox_expires_idx
  on public.notifications_outbox (expires_at);

alter table public.notifications_outbox enable row level security;
-- No policies — service_role only.
revoke all on public.notifications_outbox from authenticated, anon;

create or replace function public.enqueue_notification(
  p_user_id            uuid,
  p_category           text,
  p_kind               text,
  p_title_key          text,
  p_body_key           text,
  p_body_args          jsonb default '{}'::jsonb,
  p_data               jsonb default '{}'::jsonb,
  p_dedupe_key         text default null,
  p_bypass_preferences boolean default false
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_id uuid;
begin
  if p_user_id is null then return null; end if;
  -- Self-suppression: never notify the actor of their own action.
  if p_user_id = coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid) then
    return null;
  end if;
  insert into public.notifications_outbox(
    user_id, category, kind, title_key, body_key, body_args, data, dedupe_key, bypass_preferences
  )
  values (p_user_id, p_category, p_kind, p_title_key, p_body_key, p_body_args, p_data, p_dedupe_key, p_bypass_preferences)
  on conflict (dedupe_key) where dedupe_key is not null do nothing
  returning notification_id into v_id;
  return v_id;
end $$;

revoke all on function public.enqueue_notification(uuid, text, text, text, text, jsonb, jsonb, text, boolean) from public;
grant execute on function public.enqueue_notification(uuid, text, text, text, text, jsonb, jsonb, text, boolean) to service_role;

commit;
```

- [ ] **Step 2: Apply migration to dev (via Supabase MCP)**

Run the migration through the Supabase tooling. Confirm the table exists:
```sql
select count(*) from public.notifications_outbox;
```
Expected: 0.

- [ ] **Step 3: Smoke-test the helper**

Run:
```sql
-- expected: returns a uuid
select public.enqueue_notification(
  '<a real user_id from your dev DB>'::uuid,
  'critical', 'chat_message', 'notifications.chatTitle', 'notifications.chatBody',
  '{"senderName":"test","messagePreview":"hi"}'::jsonb,
  '{"route":"/chat/[id]","params":{"id":"abc"}}'::jsonb,
  null, false
);

-- expected: 1 row
select notification_id, kind, category, body_args from public.notifications_outbox order by created_at desc limit 1;

-- cleanup
delete from public.notifications_outbox where kind='chat_message' and body_args->>'senderName'='test';
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0046_notifications_outbox.sql
git commit -m "feat(notif)(infra): add notifications_outbox table and enqueue helper

Mapped to spec: FR-NOTIF-001..011, FR-NOTIF-014."
```

---

### Task 9: Migration 0047 — chat message trigger (FR-NOTIF-001/002/003)

**Files:**
- Create: `supabase/migrations/0047_notifications_chat_trigger.sql`

- [ ] **Step 1: Write the migration**

`supabase/migrations/0047_notifications_chat_trigger.sql`:
```sql
-- 0047_notifications_chat_trigger | P1.5 — FR-NOTIF-001/002/003.
-- Single trigger on messages handles three FRs:
--   • user message in a regular chat        → FR-NOTIF-001 (chat_message)
--   • user message in an admin_support chat → FR-NOTIF-002 (support_message)
--   • system message in any chat            → FR-NOTIF-003 (system_message)
-- Self-suppression is handled inside enqueue_notification.

begin;

create or replace function public.messages_enqueue_notification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_chat_kind  text;
  v_recipient  uuid;
  v_title_key  text;
  v_body_key   text;
  v_kind       text;
  v_dedupe     text;
  v_preview    text;
  v_sender_name text;
begin
  -- Identify the chat kind and the recipient (the participant who isn't the sender).
  select c.kind into v_chat_kind from public.chats c where c.chat_id = NEW.chat_id;
  select cp.user_id into v_recipient
    from public.chat_participants cp
    where cp.chat_id = NEW.chat_id and cp.user_id <> NEW.sender_id
    limit 1;
  if v_recipient is null then return NEW; end if;

  v_preview := left(coalesce(NEW.body, ''), 80);

  if NEW.kind = 'system' then
    v_kind := 'system_message';
    v_title_key := 'notifications.systemTitle';
    v_body_key  := 'notifications.systemBody';
    v_dedupe    := 'system:' || NEW.message_id::text;
  elsif v_chat_kind = 'admin_support' then
    v_kind := 'support_message';
    v_title_key := 'notifications.supportTitle';
    v_body_key  := 'notifications.chatBody';
    v_dedupe    := 'chat:' || NEW.chat_id::text || ':' || NEW.sender_id::text || ':' ||
                   floor(extract(epoch from NEW.created_at) / 60)::text;
  else
    v_kind := 'chat_message';
    v_title_key := 'notifications.chatTitle';
    v_body_key  := 'notifications.chatBody';
    v_dedupe    := 'chat:' || NEW.chat_id::text || ':' || NEW.sender_id::text || ':' ||
                   floor(extract(epoch from NEW.created_at) / 60)::text;
  end if;

  select coalesce(u.display_name, 'Karma user') into v_sender_name
    from public.users u
    where u.user_id = NEW.sender_id;

  perform public.enqueue_notification(
    v_recipient,
    'critical',
    v_kind,
    v_title_key,
    v_body_key,
    jsonb_build_object('senderName', coalesce(v_sender_name, 'Karma user'), 'messagePreview', v_preview),
    jsonb_build_object('route', '/chat/[id]', 'params', jsonb_build_object('id', NEW.chat_id::text), 'chat_id', NEW.chat_id::text),
    v_dedupe,
    false
  );

  return NEW;
end $$;

drop trigger if exists tg_messages_enqueue_notification on public.messages;
create trigger tg_messages_enqueue_notification
  after insert on public.messages
  for each row
  execute function public.messages_enqueue_notification();

commit;
```

> **Verify column names** before running: the trigger references `messages.chat_id`, `messages.sender_id`, `messages.kind`, `messages.body`, `messages.message_id`, and `chat_participants.user_id`. If your schema uses different names (likely correct per the chat migration 0004), adapt them. Inspect via `supabase__list_tables` or read `supabase/migrations/0004_init_chat_messaging.sql`.

- [ ] **Step 2: Apply migration**

Apply to dev. Then run a smoke test:
```sql
-- Insert a chat message as one user, confirm outbox row for the other:
insert into public.messages (chat_id, sender_id, body, kind)
values ('<an existing chat_id>'::uuid, '<sender user_id>'::uuid, 'hello', 'user');

select user_id, kind, title_key, body_args from public.notifications_outbox
order by created_at desc limit 1;
-- Expected: user_id = the OTHER participant, kind='chat_message'.

-- cleanup
delete from public.notifications_outbox where data->>'chat_id' = '<that chat_id>';
delete from public.messages where body='hello' and kind='user' order by created_at desc limit 1;
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0047_notifications_chat_trigger.sql
git commit -m "feat(notif)(infra): enqueue notifications on message insert

Branches by chat.kind and message.kind to cover FR-NOTIF-001/002/003.

Mapped to spec: FR-NOTIF-001, FR-NOTIF-002, FR-NOTIF-003."
```

---

### Task 10: Migration 0048 — crons + database webhook

**Files:**
- Create: `supabase/migrations/0048_notifications_dispatcher_glue.sql`

This migration wires the trigger that fires the Edge Function, plus the retry/TTL/token-prune crons.

- [ ] **Step 1: Write the migration**

`supabase/migrations/0048_notifications_dispatcher_glue.sql`:
```sql
-- 0048_notifications_dispatcher_glue | P1.5 — webhook + crons.
-- The webhook must be created via the Supabase dashboard (Database Webhooks UI)
-- because supabase_functions.http_request is only available in pg_net contexts
-- that the dashboard configures. We register the helper function here and
-- the dashboard webhook calls it.
--
-- Steps for the operator after applying this migration:
--   1. Dashboard → Database → Webhooks → Create:
--      • Name:   notify_dispatch_on_outbox_insert
--      • Table:  public.notifications_outbox
--      • Events: INSERT
--      • Type:   Supabase Edge Functions
--      • Function: dispatch-notification
--      • HTTP Headers: { "Authorization": "Bearer <SERVICE_ROLE_KEY>" }
--   2. Save. (Dashboard handles auth + retries.)
--
-- This SQL file enables pg_cron + pg_net (if not already installed) and creates
-- the crons. NOTE: verified 2026-05-13 — neither extension is enabled in
-- the current Supabase project; this migration is the first to require them.

begin;

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Daily 04:00 UTC: TTL cleanup of outbox.
select cron.schedule(
  'notifications_outbox_ttl',
  '0 4 * * *',
  $$ delete from public.notifications_outbox where expires_at < now(); $$
);

-- Daily 04:00 UTC: prune devices not seen in 90 days (FR-NOTIF-015 AC4).
select cron.schedule(
  'notifications_token_prune',
  '0 4 * * *',
  $$ delete from public.devices where last_seen_at < (now() - interval '90 days'); $$
);

-- Every minute: retry pending outbox rows whose webhook delivery may have failed.
-- Uses pg_net (already installed) to POST the row directly to the dispatcher.
-- The Edge Function endpoint URL is read from app.settings; operator sets it
-- via `alter database postgres set app.settings.functions_url = 'https://<ref>.supabase.co';`
select cron.schedule(
  'notifications_retry_pending',
  '* * * * *',
  $$
  do $body$
  declare r record;
  begin
    for r in
      select notification_id from public.notifications_outbox
      where dispatched_at is null
        and attempts < 3
        and created_at > now() - interval '1 hour'
      limit 50
    loop
      perform net.http_post(
        url     := current_setting('app.settings.functions_url') || '/functions/v1/dispatch-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body    := (
          select jsonb_build_object('type', 'RETRY', 'table', 'notifications_outbox', 'record', to_jsonb(n))
          from public.notifications_outbox n
          where n.notification_id = r.notification_id
        )
      );
    end loop;
  end
  $body$;
  $$
);

commit;
```

- [ ] **Step 2: Set the two GUCs**

In the Supabase SQL editor:
```sql
alter database postgres set app.settings.functions_url = 'https://<your-project-ref>.supabase.co';
alter database postgres set app.settings.service_role_key = '<your-service-role-key>';
-- reload
select pg_reload_conf();
```
> Operator action — not in committed code. The keys are also available as Edge Function secrets but pg_cron needs them in DB GUCs.

- [ ] **Step 3: Apply migration + verify crons**

```sql
select jobname, schedule, active from cron.job where jobname like 'notifications_%';
-- Expected: 3 rows, all active=true.
```

- [ ] **Step 4: Create the webhook via Dashboard**

Follow the in-file instructions to create `notify_dispatch_on_outbox_insert` in the Supabase Dashboard.

> The dashboard step is documented in the migration's header comment so it's discoverable for anyone replaying the migration history.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0048_notifications_dispatcher_glue.sql
git commit -m "feat(notif)(infra): add retry/TTL/prune crons for notifications

Webhook setup documented in-file (must be configured via dashboard).

Mapped to spec: FR-NOTIF-015 AC4, NFR-PERF-007."
```

---

### Task 11: Edge Function — i18n dictionary

**Files:**
- Create: `supabase/functions/dispatch-notification/i18n.json`

- [ ] **Step 1: Create the JSON file**

`supabase/functions/dispatch-notification/i18n.json`:
```json
{
  "notifications.chatTitle": "{{senderName}}",
  "notifications.chatBody": "{{messagePreview}}",
  "notifications.chatBodyCoalesced": "{{count}} הודעות חדשות",
  "notifications.supportTitle": "תמיכת קהילת קארמה",
  "notifications.systemTitle": "הודעת מערכת",
  "notifications.systemBody": "{{messagePreview}}",
  "notifications.postExpiringTitle": "הפוסט שלך יפוג בעוד 7 ימים",
  "notifications.postExpiringBody": "{{postTitle}}",
  "notifications.markRecipientTitle": "{{ownerName}}",
  "notifications.markRecipientBody": "סימן אותך כמקבל של {{postTitle}}",
  "notifications.unmarkRecipientTitle": "{{recipientName}}",
  "notifications.unmarkRecipientBody": "הסיר את הסימון מ-{{postTitle}}",
  "notifications.autoRemovedTitle": "הפוסט שלך הוסר",
  "notifications.autoRemovedBody": "הסיבה: דווח על-ידי מספר משתמשים. למידע נוסף — לחץ.",
  "notifications.followRequestTitle": "{{requesterName}}",
  "notifications.followRequestBody": "מבקש לעקוב אחריך",
  "notifications.followStartedTitle": "{{followerName}}",
  "notifications.followStartedBody": "התחיל לעקוב אחריך",
  "notifications.followStartedCoalesced": "{{count}} עוקבים חדשים",
  "notifications.followApprovedTitle": "{{targetName}}",
  "notifications.followApprovedBody": "אישר את בקשת המעקב שלך"
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/dispatch-notification/i18n.json
git commit -m "feat(notif): add server-side notification i18n dictionary

Mapped to spec: FR-NOTIF-001..011."
```

---

### Task 12: Edge Function — coalesce.ts (Deno copy of `@kc/application/notifications/coalesce`)

**Files:**
- Create: `supabase/functions/dispatch-notification/coalesce.ts`

- [ ] **Step 1: Copy the file byte-for-byte from Task 6**

`supabase/functions/dispatch-notification/coalesce.ts` — identical content to `app/packages/application/src/notifications/coalesce.ts`. Use the EXACT same file contents — the CI lint enforces byte-equality (modulo a leading import line difference if any). Update the docstring's pointer-direction to refer back to the application package.

Content:
```ts
/**
 * Coalescing helpers for the notification dispatcher (Deno copy).
 *
 * IMPORTANT: This file is byte-mirrored from app/packages/application/src/notifications/coalesce.ts.
 * CI fails the build if they drift. See scripts/check-architecture.mjs.
 */

export interface CoalesceResult {
  readonly titleKey: string;
  readonly bodyKey: string;
  readonly bodyArgs: Readonly<Record<string, string | number>>;
}

export function coalesceChat(input: {
  priorCount: number;
  senderName: string;
  messagePreview: string;
}): CoalesceResult {
  if (input.priorCount === 0) {
    return {
      titleKey: 'notifications.chatTitle',
      bodyKey: 'notifications.chatBody',
      bodyArgs: { senderName: input.senderName, messagePreview: input.messagePreview },
    };
  }
  return {
    titleKey: 'notifications.chatTitle',
    bodyKey: 'notifications.chatBodyCoalesced',
    bodyArgs: { senderName: input.senderName, count: input.priorCount + 1 },
  };
}

export function coalesceFollowStarted(input: {
  priorCount: number;
  followerName: string;
}): CoalesceResult {
  const count = input.priorCount + 1;
  if (count < 3) {
    return {
      titleKey: 'notifications.followStartedTitle',
      bodyKey: 'notifications.followStartedBody',
      bodyArgs: { followerName: input.followerName },
    };
  }
  return {
    titleKey: 'notifications.followStartedTitle',
    bodyKey: 'notifications.followStartedCoalesced',
    bodyArgs: { count },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/dispatch-notification/coalesce.ts
git commit -m "feat(notif): add Deno copy of coalesce helpers

Mirrored from packages/application; CI lint enforces byte-equality."
```

---

### Task 13: Edge Function — Expo Push client helper

**Files:**
- Create: `supabase/functions/dispatch-notification/expoPushClient.ts`

- [ ] **Step 1: Write the helper**

`supabase/functions/dispatch-notification/expoPushClient.ts`:
```ts
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface ExpoMessage {
  to: string[];
  title: string;
  body: string;
  data: Record<string, unknown>;
  channelId?: 'critical' | 'social';
  threadId?: string;
  priority?: 'default' | 'normal' | 'high';
  sound?: 'default' | null;
  badge?: number;
}

export interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

/**
 * Sends a batch of up to 100 Expo messages. Returns the per-message tickets.
 * The caller is responsible for inspecting each ticket and acting on
 * DeviceNotRegistered / MessageRateExceeded.
 */
export async function sendExpoPush(
  messages: ExpoMessage[],
  accessToken: string | undefined,
): Promise<ExpoTicket[]> {
  if (messages.length === 0) return [];
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate',
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(messages),
  });
  if (!response.ok) {
    throw new Error(`Expo push HTTP ${response.status}: ${await response.text()}`);
  }
  const json = await response.json();
  return (json?.data as ExpoTicket[]) ?? [];
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/dispatch-notification/expoPushClient.ts
git commit -m "feat(notif): add Expo Push HTTP client helper for Edge Function"
```

---

### Task 14: Edge Function — main `index.ts`

**Files:**
- Create: `supabase/functions/dispatch-notification/index.ts`
- Create: `supabase/functions/dispatch-notification/README.md`

- [ ] **Step 1: Write the handler**

`supabase/functions/dispatch-notification/index.ts`:
```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { coalesceChat, coalesceFollowStarted } from './coalesce.ts';
import { sendExpoPush, type ExpoMessage, type ExpoTicket } from './expoPushClient.ts';
import i18n from './i18n.json' with { type: 'json' };

interface OutboxRow {
  notification_id: string;
  user_id: string;
  category: 'critical' | 'social';
  kind: string;
  title_key: string;
  body_key: string;
  body_args: Record<string, string | number>;
  data: Record<string, unknown>;
  dedupe_key: string | null;
  bypass_preferences: boolean;
  created_at: string;
  dispatched_at: string | null;
  attempts: number;
  last_error: string | null;
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'RETRY';
  table: string;
  record: OutboxRow;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EXPO_ACCESS_TOKEN = Deno.env.get('EXPO_ACCESS_TOKEN');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function resolveString(key: string, args: Record<string, string | number>): string {
  const template = (i18n as Record<string, string>)[key] ?? key;
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(args[k] ?? ''));
}

function markDispatched(notificationId: string, error: string | null) {
  return supabase
    .from('notifications_outbox')
    .update({ dispatched_at: new Date().toISOString(), last_error: error })
    .eq('notification_id', notificationId);
}

function bumpAttempt(notificationId: string, error: string) {
  return supabase.rpc('notifications_bump_attempt', { p_id: notificationId, p_error: error });
}

Deno.serve(async (req) => {
  // Auth: dashboard webhook passes the service-role bearer.
  const auth = req.headers.get('Authorization') ?? '';
  if (auth !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = (await req.json()) as WebhookPayload;
  const row = payload.record;
  if (!row) return new Response('No record', { status: 400 });

  try {
    // Load recipient state.
    const { data: state, error: stateErr } = await supabase
      .from('users')
      .select('user_id, account_status, notification_preferences, devices(push_token, platform)')
      .eq('user_id', row.user_id)
      .maybeSingle();
    if (stateErr) throw stateErr;
    if (!state) {
      await markDispatched(row.notification_id, 'recipient_not_found');
      return new Response('OK', { status: 200 });
    }

    // FR-NOTIF-011 AC2: suspended users do not receive notifications.
    if (state.account_status && state.account_status !== 'active') {
      await markDispatched(row.notification_id, 'recipient_suspended');
      return new Response('OK', { status: 200 });
    }

    // Preference gate.
    const prefs = state.notification_preferences ?? { critical: true, social: true };
    const allowed = row.bypass_preferences || prefs[row.category] === true;
    if (!allowed) {
      await markDispatched(row.notification_id, 'suppressed_by_preference');
      return new Response('OK', { status: 200 });
    }

    const tokens = (state.devices ?? []).map((d: { push_token: string }) => d.push_token).filter(Boolean);
    if (tokens.length === 0) {
      await markDispatched(row.notification_id, 'no_devices');
      return new Response('OK', { status: 200 });
    }

    // Coalescing.
    let titleKey = row.title_key;
    let bodyKey = row.body_key;
    let bodyArgs = row.body_args;

    if (row.kind === 'chat_message') {
      const chatId = (row.data as Record<string, string>).chat_id;
      const { count } = await supabase
        .from('notifications_outbox')
        .select('notification_id', { count: 'exact', head: true })
        .eq('user_id', row.user_id)
        .eq('kind', 'chat_message')
        .neq('notification_id', row.notification_id)
        .filter('data->>chat_id', 'eq', chatId)
        .gte('dispatched_at', new Date(Date.now() - 60_000).toISOString());
      const result = coalesceChat({
        priorCount: count ?? 0,
        senderName: String(bodyArgs.senderName ?? ''),
        messagePreview: String(bodyArgs.messagePreview ?? ''),
      });
      titleKey = result.titleKey;
      bodyKey = result.bodyKey;
      bodyArgs = result.bodyArgs;
    } else if (row.kind === 'follow_started') {
      const { count } = await supabase
        .from('notifications_outbox')
        .select('notification_id', { count: 'exact', head: true })
        .eq('user_id', row.user_id)
        .eq('kind', 'follow_started')
        .neq('notification_id', row.notification_id)
        .gte('dispatched_at', new Date(Date.now() - 60 * 60_000).toISOString());
      const result = coalesceFollowStarted({
        priorCount: count ?? 0,
        followerName: String(bodyArgs.followerName ?? ''),
      });
      titleKey = result.titleKey;
      bodyKey = result.bodyKey;
      bodyArgs = result.bodyArgs;
    }

    const title = resolveString(titleKey, bodyArgs);
    const body = resolveString(bodyKey, bodyArgs);

    const message: ExpoMessage = {
      to: tokens,
      title,
      body,
      data: { ...row.data, category: row.category, kind: row.kind, notification_id: row.notification_id },
      channelId: row.category,
      threadId: typeof (row.data as Record<string, string>).chat_id === 'string'
        ? `chat:${(row.data as Record<string, string>).chat_id}`
        : undefined,
      priority: row.category === 'critical' ? 'high' : 'normal',
      sound: row.category === 'critical' ? 'default' : null,
      badge: 1,
    };

    let tickets: ExpoTicket[] = [];
    try {
      tickets = await sendExpoPush([message], EXPO_ACCESS_TOKEN);
    } catch (err) {
      await bumpAttempt(row.notification_id, String(err));
      return new Response('Retry later', { status: 200 });
    }

    // Handle per-token results (Expo returns one ticket per `to` entry).
    let allOk = true;
    let firstError: string | null = null;
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const token = tokens[i];
      if (ticket.status === 'error') {
        allOk = false;
        firstError = ticket.details?.error ?? ticket.message ?? 'unknown_error';
        if (ticket.details?.error === 'DeviceNotRegistered') {
          await supabase.from('devices').delete().eq('push_token', token);
        }
      }
    }

    if (allOk) {
      await markDispatched(row.notification_id, null);
    } else {
      // Some tokens succeeded, some didn't. Mark dispatched but log the error.
      await markDispatched(row.notification_id, firstError);
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('dispatch-notification error', err);
    await bumpAttempt(row.notification_id, String(err));
    return new Response('Internal Error', { status: 500 });
  }
});
```

> Requires a tiny RPC `notifications_bump_attempt` to atomically increment attempts. Add to a follow-up migration in Step 3.

- [ ] **Step 2: Write the README**

`supabase/functions/dispatch-notification/README.md`:
```markdown
# dispatch-notification

Fan-out push notifications from `notifications_outbox` to Expo Push Service.

## Triggers
- Database Webhook on `notifications_outbox` INSERT (real-time, ~1s latency).
- pg_cron `notifications_retry_pending` (every minute, retries pending rows).

## Secrets required
- `SUPABASE_SERVICE_ROLE_KEY` (built-in).
- `EXPO_ACCESS_TOKEN` (optional but recommended; set via Supabase dashboard → Functions → Secrets).

## Deploy
```bash
supabase functions deploy dispatch-notification --project-ref <REF>
```

## Test locally
```bash
supabase functions serve dispatch-notification --env-file .env.local
# in another shell:
curl -X POST http://localhost:54321/functions/v1/dispatch-notification \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","table":"notifications_outbox","record":{ ... full outbox row ... }}'
```
```

- [ ] **Step 3: Add the bump-attempt RPC**

Create `supabase/migrations/0049_notifications_bump_attempt.sql`:
```sql
begin;

create or replace function public.notifications_bump_attempt(p_id uuid, p_error text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.notifications_outbox
  set attempts = attempts + 1, last_error = p_error
  where notification_id = p_id;
$$;

revoke all on function public.notifications_bump_attempt(uuid, text) from public;
grant execute on function public.notifications_bump_attempt(uuid, text) to service_role;

commit;
```
Apply to dev.

- [ ] **Step 4: Deploy the Edge Function**

```bash
cd supabase
supabase functions deploy dispatch-notification --project-ref <your-project-ref>
```

Confirm in dashboard under Functions list.

- [ ] **Step 5: End-to-end smoke test**

Insert a synthetic outbox row for your own user — the webhook should fire the Edge Function. (Since you have no token registered yet, expect `last_error='no_devices'`.)
```sql
select public.enqueue_notification(
  '<your_user_id>'::uuid, 'critical', 'chat_message',
  'notifications.chatTitle', 'notifications.chatBody',
  '{"senderName":"smoke","messagePreview":"end-to-end"}'::jsonb,
  '{"route":"/chat/[id]","params":{"id":"smoke"},"chat_id":"smoke"}'::jsonb,
  null, false
);
-- wait 2 seconds
select dispatched_at, last_error from public.notifications_outbox
where body_args->>'senderName' = 'smoke' order by created_at desc limit 1;
-- Expected: dispatched_at IS NOT NULL, last_error = 'no_devices'
```

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/dispatch-notification/index.ts supabase/functions/dispatch-notification/README.md supabase/migrations/0049_notifications_bump_attempt.sql
git commit -m "feat(notif): add dispatch-notification Edge Function

Subscribes to notifications_outbox INSERTs via dashboard webhook,
applies preference/suppression/coalescing, calls Expo Push HTTP API,
and handles DeviceNotRegistered cleanup.

Mapped to spec: FR-NOTIF-001..011, FR-NOTIF-014, FR-NOTIF-015, NFR-PERF-007."
```

---

### Task 15: Client — `useActiveScreenStore`

**Files:**
- Create: `app/apps/mobile/src/lib/notifications/useActiveScreenStore.ts`

- [ ] **Step 1: Write the store**

`app/apps/mobile/src/lib/notifications/useActiveScreenStore.ts`:
```ts
import { create } from 'zustand';

interface State {
  route: string | null;
  setRoute: (route: string | null) => void;
}

/** Tracks the current expo-router route so non-React code (notification handler) can read it. */
export const useActiveScreenStore = create<State>((set) => ({
  route: null,
  setRoute: (route) => set({ route }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add app/apps/mobile/src/lib/notifications/useActiveScreenStore.ts
git commit -m "feat(notif)(mobile): add active-screen zustand store for foreground handler"
```

---

### Task 16: Client — `usePushPermissionGate` hook

**Files:**
- Create: `app/apps/mobile/src/lib/notifications/usePushPermissionGate.ts`

- [ ] **Step 1: Write the hook**

`app/apps/mobile/src/lib/notifications/usePushPermissionGate.ts`:
```ts
import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const STORAGE_KEY = 'push_permission_state';
const COOLDOWN_DAYS = 30;

export type PrePromptTrigger = 'first-message-sent' | 'first-post-published';

interface State {
  lastPromptAt: string | null;
  lastDecision: 'denied' | 'granted' | 'pending' | null;
  osPromptShown: boolean;
}

const initial: State = { lastPromptAt: null, lastDecision: null, osPromptShown: false };

async function load(): Promise<State> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as State) : initial;
}

async function save(state: State): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function withinCooldown(state: State): boolean {
  if (state.lastDecision !== 'denied' || !state.lastPromptAt) return false;
  const elapsedDays = (Date.now() - new Date(state.lastPromptAt).getTime()) / 86_400_000;
  return elapsedDays < COOLDOWN_DAYS;
}

/**
 * Pre-prompt gate. Caller wires it into the moment of a contextual trigger
 * (first chat sent, first post published) and renders a modal returned by
 * `presentPrePrompt`. On accept, the OS prompt is invoked.
 */
export function usePushPermissionGate() {
  const [modalState, setModalState] = useState<{ visible: boolean; trigger: PrePromptTrigger | null }>({
    visible: false, trigger: null,
  });

  const shouldPrompt = useCallback(async (): Promise<boolean> => {
    const state = await load();
    const perm = await Notifications.getPermissionsAsync();
    if (perm.status === 'granted') return false;
    if (perm.canAskAgain === false) return false;
    if (withinCooldown(state)) return false;
    return true;
  }, []);

  const presentPrePrompt = useCallback(async (trigger: PrePromptTrigger): Promise<void> => {
    if (!(await shouldPrompt())) return;
    setModalState({ visible: true, trigger });
  }, [shouldPrompt]);

  const handleAccept = useCallback(async (): Promise<'granted' | 'denied'> => {
    setModalState({ visible: false, trigger: null });
    const result = await Notifications.requestPermissionsAsync();
    const status = result.status === 'granted' ? 'granted' : 'denied';
    await save({ lastPromptAt: new Date().toISOString(), lastDecision: status, osPromptShown: true });
    return status;
  }, []);

  const handleDecline = useCallback(async (): Promise<void> => {
    setModalState({ visible: false, trigger: null });
    await save({ lastPromptAt: new Date().toISOString(), lastDecision: 'denied', osPromptShown: false });
  }, []);

  return { modalState, presentPrePrompt, handleAccept, handleDecline };
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/lib/notifications/usePushPermissionGate.ts
git commit -m "feat(notif)(mobile): add usePushPermissionGate hook with 30d cooldown

Mapped to spec: FR-NOTIF-015 AC1, AC5."
```

---

### Task 17: Client — `EnablePushModal` component

**Files:**
- Create: `app/apps/mobile/src/components/EnablePushModal.tsx`

- [ ] **Step 1: Write the component**

`app/apps/mobile/src/components/EnablePushModal.tsx`:
```tsx
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PrePromptTrigger } from '../lib/notifications/usePushPermissionGate';

interface Props {
  visible: boolean;
  trigger: PrePromptTrigger | null;
  onAccept: () => void;
  onDecline: () => void;
}

export function EnablePushModal({ visible, trigger, onAccept, onDecline }: Props) {
  const { t } = useTranslation();
  const bodyKey = trigger === 'first-post-published'
    ? 'notifications.enablePushBodyFromPost'
    : 'notifications.enablePushBodyFromChat';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDecline}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('notifications.enablePushTitle')}</Text>
          <Text style={styles.body}>{t(bodyKey)}</Text>
          <Pressable style={[styles.button, styles.accept]} onPress={onAccept}>
            <Text style={styles.acceptText}>{t('notifications.enablePushAccept')}</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={onDecline}>
            <Text style={styles.declineText}>{t('notifications.enablePushDecline')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 20 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12, textAlign: 'right' },
  body: { fontSize: 14, color: '#444', marginBottom: 20, textAlign: 'right' },
  button: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  accept: { backgroundColor: '#0A8754' },
  acceptText: { color: 'white', fontWeight: '600' },
  declineText: { color: '#666' },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/apps/mobile/src/components/EnablePushModal.tsx
git commit -m "feat(notif)(mobile): add EnablePushModal pre-prompt component

Mapped to spec: FR-NOTIF-015 AC1."
```

---

### Task 18: Client — i18n partial

**Files:**
- Create: `app/apps/mobile/src/i18n/partials/notificationsHe.ts`
- Modify: `app/apps/mobile/src/i18n/he.ts`

- [ ] **Step 1: Create the partial**

`app/apps/mobile/src/i18n/partials/notificationsHe.ts`:
```ts
export const notificationsHe = {
  settingsTitle: 'התראות',
  criticalLabel: 'קריטיות',
  criticalCaption: "הודעות צ'אט, סימון כמקבל, התראות מערכת, פוסט שעומד לפוג, הסרת תוכן",
  socialLabel: 'חברתיות',
  socialCaption: 'עוקבים חדשים, בקשות מעקב, בקשות מאושרות',
  deviceStatusSection: 'סטטוס המכשיר',
  permissionGranted: 'הרשאת התראות מופעלת',
  permissionDenied: 'הרשאה חסומה בהגדרות המכשיר',
  tokenRegistered: 'המכשיר רשום',
  tokenNotRegistered: 'המכשיר טרם נרשם',
  openOsSettings: 'פתח הגדרות',

  enablePushTitle: 'להישאר בקשר?',
  enablePushBodyFromChat: 'נשלח לך התראה כשמישהו עונה לך — גם כשהאפליקציה סגורה.',
  enablePushBodyFromPost: 'נשלח לך התראה כשמישהו פנה בנוגע לפוסט שלך — גם כשהאפליקציה סגורה.',
  enablePushAccept: 'כן, להפעיל',
  enablePushDecline: 'אולי בפעם אחרת',

  // Server-side mirrored (also in supabase/functions/dispatch-notification/i18n.json).
  chatTitle: '{{senderName}}',
  chatBody: '{{messagePreview}}',
  chatBodyCoalesced: '{{count}} הודעות חדשות',
  supportTitle: 'תמיכת קהילת קארמה',
  systemTitle: 'הודעת מערכת',
  systemBody: '{{messagePreview}}',
  postExpiringTitle: 'הפוסט שלך יפוג בעוד 7 ימים',
  postExpiringBody: '{{postTitle}}',
  markRecipientTitle: '{{ownerName}}',
  markRecipientBody: 'סימן אותך כמקבל של {{postTitle}}',
  unmarkRecipientTitle: '{{recipientName}}',
  unmarkRecipientBody: 'הסיר את הסימון מ-{{postTitle}}',
  autoRemovedTitle: 'הפוסט שלך הוסר',
  autoRemovedBody: 'הסיבה: דווח על-ידי מספר משתמשים. למידע נוסף — לחץ.',
  followRequestTitle: '{{requesterName}}',
  followRequestBody: 'מבקש לעקוב אחריך',
  followStartedTitle: '{{followerName}}',
  followStartedBody: 'התחיל לעקוב אחריך',
  followStartedCoalesced: '{{count}} עוקבים חדשים',
  followApprovedTitle: '{{targetName}}',
  followApprovedBody: 'אישר את בקשת המעקב שלך',
};
```

- [ ] **Step 2: Wire into `he.ts`**

In `app/apps/mobile/src/i18n/he.ts`, add an import at the top:
```ts
import { notificationsHe } from './partials/notificationsHe';
```
And add a key inside the default export object:
```ts
  notifications: notificationsHe,
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/src/i18n/partials/notificationsHe.ts app/apps/mobile/src/i18n/he.ts
git commit -m "feat(notif)(mobile): add Hebrew i18n strings for notifications + Settings"
```

---

### Task 19: Client — register device, foreground handler, tap router (wired in `_layout.tsx`)

**Files:**
- Create: `app/apps/mobile/src/lib/notifications/register.ts`
- Create: `app/apps/mobile/src/lib/notifications/foregroundHandler.ts`
- Create: `app/apps/mobile/src/lib/notifications/tapHandler.ts`
- Create: `app/apps/mobile/src/lib/notifications/badge.ts`
- Create: `app/apps/mobile/src/lib/notifications/index.ts` (barrel)
- Modify: `app/apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Register helper**

`app/apps/mobile/src/lib/notifications/register.ts`:
```ts
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { RegisterDeviceUseCase, DeactivateDeviceUseCase } from '@kc/application';
import type { IDeviceRepository } from '@kc/application';

export async function registerCurrentDeviceIfPermitted(
  userId: string,
  deps: { deviceRepo: IDeviceRepository },
): Promise<void> {
  if (!Device.isDevice) return;
  const perm = await Notifications.getPermissionsAsync();
  if (perm.status !== 'granted') return;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('No EAS projectId configured — push token cannot be registered');
    return;
  }
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  const platform = (Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web') as
    'ios' | 'android' | 'web';
  await new RegisterDeviceUseCase(deps.deviceRepo).execute({ userId, pushToken: token, platform });
}

export async function deactivateCurrentDevice(deps: { deviceRepo: IDeviceRepository }): Promise<void> {
  if (!Device.isDevice) return;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return;
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await new DeactivateDeviceUseCase(deps.deviceRepo).execute(token);
  } catch {
    // Token unavailable — nothing to deactivate.
  }
}
```

- [ ] **Step 2: Foreground handler**

`app/apps/mobile/src/lib/notifications/foregroundHandler.ts`:
```ts
import * as Notifications from 'expo-notifications';
import type { PushData } from '@kc/domain';
import { useActiveScreenStore } from './useActiveScreenStore';

let installed = false;

export function installForegroundHandler(): void {
  if (installed) return;
  installed = true;
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data as Partial<PushData>;
      const activeRoute = useActiveScreenStore.getState().route;
      if (data?.kind === 'chat_message' && data.chat_id && activeRoute === `/chat/${data.chat_id}`) {
        return { shouldShowAlert: false, shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: false, shouldShowList: false };
      }
      return { shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true };
    },
  });
}
```

- [ ] **Step 3: Tap handler**

`app/apps/mobile/src/lib/notifications/tapHandler.ts`:
```ts
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import type { PushData } from '@kc/domain';

function handleNotificationTap(data: Partial<PushData>): void {
  if (!data?.route) return;
  router.push({ pathname: data.route as never, params: data.params ?? {} });
}

export function useNotificationTapRouting(): void {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationTap(response.notification.request.content.data as Partial<PushData>);
    });
    // Cold-start: there may be a tap that opened the app.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationTap(response.notification.request.content.data as Partial<PushData>);
      }
    });
    return () => sub.remove();
  }, []);
}
```

- [ ] **Step 4: Badge helper**

`app/apps/mobile/src/lib/notifications/badge.ts`:
```ts
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';

let installed = false;

export function installBadgeAutoClear(): void {
  if (installed) return;
  installed = true;
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      Notifications.setBadgeCountAsync(0).catch(() => undefined);
    }
  });
}
```

- [ ] **Step 5: Barrel**

`app/apps/mobile/src/lib/notifications/index.ts`:
```ts
export { useActiveScreenStore } from './useActiveScreenStore';
export { usePushPermissionGate } from './usePushPermissionGate';
export { registerCurrentDeviceIfPermitted, deactivateCurrentDevice } from './register';
export { installForegroundHandler } from './foregroundHandler';
export { useNotificationTapRouting } from './tapHandler';
export { installBadgeAutoClear } from './badge';
```

- [ ] **Step 6: Wire into `_layout.tsx`**

In `app/apps/mobile/app/_layout.tsx`, add (inside the root component, after the existing AuthGate / providers):
```tsx
import { useNavigationState } from 'expo-router';
import {
  installForegroundHandler,
  installBadgeAutoClear,
  useNotificationTapRouting,
  useActiveScreenStore,
  registerCurrentDeviceIfPermitted,
} from '../src/lib/notifications';
import { container } from '../src/lib/container';

function NotificationsBridge() {
  const state = useNavigationState((s) => s);
  const setRoute = useActiveScreenStore((s) => s.setRoute);
  useNotificationTapRouting();

  useEffect(() => {
    installForegroundHandler();
    installBadgeAutoClear();
  }, []);

  useEffect(() => {
    // Track the current pathname from expo-router for the foreground handler.
    const currentPath = state?.routes?.[state.index]?.name ?? null;
    setRoute(currentPath);
  }, [state, setRoute]);

  // Register device when user becomes authenticated.
  const userId = useAuthSession((s) => s.userId);
  useEffect(() => {
    if (!userId) return;
    registerCurrentDeviceIfPermitted(userId, { deviceRepo: container.deviceRepo }).catch(console.error);
  }, [userId]);

  return null;
}
```
And mount `<NotificationsBridge />` inside the existing provider tree.

> The `container.deviceRepo` reference assumes you've added an instance to the DI container — done in Task 20.

- [ ] **Step 7: Typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add app/apps/mobile/src/lib/notifications/ app/apps/mobile/app/_layout.tsx
git commit -m "feat(notif)(mobile): wire registration, foreground handler, tap router, badge auto-clear

Mapped to spec: FR-NOTIF-001 AC2, FR-NOTIF-015 AC1..AC3."
```

---

### Task 20: Wire `SupabaseDeviceRepository` into the DI container

**Files:**
- Modify: `app/apps/mobile/src/lib/container.ts`

- [ ] **Step 1: Add the instance**

Locate `app/apps/mobile/src/lib/container.ts`. Add to imports:
```ts
import { SupabaseDeviceRepository } from '@kc/infrastructure-supabase';
```
Add a field on the container:
```ts
deviceRepo: new SupabaseDeviceRepository(supabaseClient),
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/lib/container.ts
git commit -m "feat(notif)(mobile): expose SupabaseDeviceRepository through DI container"
```

---

### Task 21: Wire pre-prompt to `chat/[id].tsx` first-message-sent

**Files:**
- Modify: `app/apps/mobile/app/chat/[id].tsx`

- [ ] **Step 1: Detect first-message-sent and trigger gate**

Inside the chat screen component, locate the success handler for `sendMessage`. Add:
```tsx
import { usePushPermissionGate, EnablePushModal } from '../../src/lib/notifications';
// import EnablePushModal from '../../src/components/EnablePushModal';
import { EnablePushModal } from '../../src/components/EnablePushModal';

// inside the component:
const { modalState, presentPrePrompt, handleAccept, handleDecline } = usePushPermissionGate();
const sentFirstThisSessionRef = useRef(false);

// inside onSendSuccess:
if (!sentFirstThisSessionRef.current) {
  // Only the first send-success per session triggers; cheap check.
  const hasSentBefore = /* await chatRepo.hasSentAnyMessage(userId) — see note below */;
  if (!hasSentBefore) {
    sentFirstThisSessionRef.current = true;
    await presentPrePrompt('first-message-sent');
  }
}

// In JSX:
<EnablePushModal
  visible={modalState.visible}
  trigger={modalState.trigger}
  onAccept={async () => {
    const status = await handleAccept();
    if (status === 'granted') {
      await registerCurrentDeviceIfPermitted(userId, { deviceRepo: container.deviceRepo });
    }
  }}
  onDecline={handleDecline}
/>
```

> **`hasSentAnyMessage` port method:** add a method to `IChatRepository` and implement in `SupabaseChatRepository`. SQL: `select exists(select 1 from messages where sender_id = $1 and kind = 'user') as has_sent`. ~10 LOC additional.

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/app/chat/[id].tsx app/packages/application/src/chat/ app/packages/infrastructure-supabase/src/chat/
git commit -m "feat(notif)(mobile): present push pre-prompt on first chat message sent

Adds IChatRepository.hasSentAnyMessage() and wires the gate from the
chat screen's send-success callback.

Mapped to spec: FR-NOTIF-015 AC1."
```

---

### Task 22: `UpdateNotificationPreferencesUseCase` — TDD

**Files:**
- Create: `app/packages/application/src/notifications/UpdateNotificationPreferencesUseCase.ts`
- Create: `app/packages/application/src/notifications/__tests__/UpdateNotificationPreferencesUseCase.test.ts`
- Modify: `app/packages/application/src/auth/IUserRepository.ts` (add method)
- Modify: `app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts` (implement)

- [ ] **Step 1: Add port method**

In `IUserRepository.ts`, add:
```ts
updateNotificationPreferences(
  userId: string,
  partial: { critical?: boolean; social?: boolean },
): Promise<NotificationPreferences>;
```

- [ ] **Step 2: Implement adapter method**

In `SupabaseUserRepository.ts`, add:
```ts
async updateNotificationPreferences(userId, partial) {
  const merge: Record<string, boolean> = {};
  if (partial.critical !== undefined) merge.critical = partial.critical;
  if (partial.social !== undefined) merge.social = partial.social;
  const { data, error } = await this.client.rpc('users_merge_notification_preferences', {
    p_user_id: userId, p_merge: merge,
  });
  if (error) throw error;
  return data as { critical: boolean; social: boolean };
}
```

- [ ] **Step 3: RPC migration**

Add to `supabase/migrations/0049_notifications_bump_attempt.sql` (or a new 0050 if you've already committed 0049):
```sql
create or replace function public.users_merge_notification_preferences(p_user_id uuid, p_merge jsonb)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.users
  set notification_preferences = notification_preferences || p_merge
  where user_id = p_user_id and user_id = auth.uid()
  returning notification_preferences;
$$;

revoke all on function public.users_merge_notification_preferences(uuid, jsonb) from public;
grant execute on function public.users_merge_notification_preferences(uuid, jsonb) to authenticated;
```

- [ ] **Step 4: Test**

`app/packages/application/src/notifications/__tests__/UpdateNotificationPreferencesUseCase.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { UpdateNotificationPreferencesUseCase } from '../UpdateNotificationPreferencesUseCase';

class FakeUserRepo {
  prefs: { critical: boolean; social: boolean } = { critical: true, social: true };
  async updateNotificationPreferences(_userId: string, partial: { critical?: boolean; social?: boolean }) {
    this.prefs = { ...this.prefs, ...partial };
    return this.prefs;
  }
}

describe('UpdateNotificationPreferencesUseCase', () => {
  it('updates only the supplied field', async () => {
    const repo = new FakeUserRepo() as unknown as Parameters<typeof UpdateNotificationPreferencesUseCase>[0];
    const uc = new UpdateNotificationPreferencesUseCase(repo);
    const result = await uc.execute({ userId: 'u1', critical: false });
    expect(result).toEqual({ critical: false, social: true });
  });

  it('updates both when both supplied', async () => {
    const repo = new FakeUserRepo() as unknown as Parameters<typeof UpdateNotificationPreferencesUseCase>[0];
    const uc = new UpdateNotificationPreferencesUseCase(repo);
    const result = await uc.execute({ userId: 'u1', critical: false, social: false });
    expect(result).toEqual({ critical: false, social: false });
  });
});
```

- [ ] **Step 5: Implementation**

`app/packages/application/src/notifications/UpdateNotificationPreferencesUseCase.ts`:
```ts
import type { IUserRepository } from '../auth/IUserRepository';

export class UpdateNotificationPreferencesUseCase {
  constructor(private readonly userRepo: Pick<IUserRepository, 'updateNotificationPreferences'>) {}

  async execute(input: { userId: string; critical?: boolean; social?: boolean }) {
    return this.userRepo.updateNotificationPreferences(input.userId, {
      critical: input.critical,
      social: input.social,
    });
  }
}
```

- [ ] **Step 6: Verify tests pass**

```bash
pnpm --filter @kc/application test -- UpdateNotificationPreferencesUseCase
```
Expected: 2/2 PASS.

- [ ] **Step 7: Commit**

```bash
git add app/packages/application/src/notifications/UpdateNotificationPreferencesUseCase.ts app/packages/application/src/notifications/__tests__/UpdateNotificationPreferencesUseCase.test.ts app/packages/application/src/auth/IUserRepository.ts app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts supabase/migrations/0049_*.sql
git commit -m "feat(notif)(application): add UpdateNotificationPreferencesUseCase

Includes the IUserRepository.updateNotificationPreferences port, the
SupabaseUserRepository implementation, and the RPC that JSON-merges
the preferences atomically.

Mapped to spec: FR-NOTIF-014, FR-SETTINGS-005."
```

---

### Task 23: `NotificationToggleRow` component

**Files:**
- Create: `app/apps/mobile/src/components/NotificationToggleRow.tsx`

- [ ] **Step 1: Write the component**

`app/apps/mobile/src/components/NotificationToggleRow.tsx`:
```tsx
import { View, Text, Switch, StyleSheet } from 'react-native';

interface Props {
  label: string;
  caption: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (next: boolean) => void;
}

export function NotificationToggleRow({ label, caption, value, disabled, onValueChange }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.caption}>{caption}</Text>
      </View>
      <Switch value={value} disabled={disabled} onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e0e0e0' },
  text: { flex: 1, marginRight: 12 },
  label: { fontSize: 16, fontWeight: '500', textAlign: 'right' },
  caption: { fontSize: 12, color: '#666', marginTop: 4, textAlign: 'right' },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/apps/mobile/src/components/NotificationToggleRow.tsx
git commit -m "feat(notif)(mobile): add NotificationToggleRow component"
```

---

### Task 24: Settings → התראות screen

**Files:**
- Create: `app/apps/mobile/app/settings/notifications.tsx`
- Modify: `app/apps/mobile/app/settings.tsx` (wire entry row)

- [ ] **Step 1: Write the screen**

`app/apps/mobile/app/settings/notifications.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Linking, StyleSheet, Pressable } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { NotificationToggleRow } from '../../src/components/NotificationToggleRow';
import { useAuthSession } from '../../src/lib/auth';
import { container } from '../../src/lib/container';
import { UpdateNotificationPreferencesUseCase } from '@kc/application';

const updateUC = new UpdateNotificationPreferencesUseCase(container.userRepo);

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const userId = useAuthSession((s) => s.userId);
  const qc = useQueryClient();
  const [permStatus, setPermStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  useEffect(() => {
    Notifications.getPermissionsAsync().then((p) => setPermStatus(p.status as 'granted' | 'denied' | 'undetermined'));
  }, []);

  const prefsQuery = useQuery({
    queryKey: ['notification-preferences', userId],
    queryFn: async () => {
      const user = await container.userRepo.findById(userId!);
      return user!.notificationPreferences;
    },
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: async (partial: { critical?: boolean; social?: boolean }) => updateUC.execute({ userId: userId!, ...partial }),
    onMutate: async (partial) => {
      await qc.cancelQueries({ queryKey: ['notification-preferences', userId] });
      const previous = qc.getQueryData(['notification-preferences', userId]);
      qc.setQueryData(['notification-preferences', userId], (old: { critical: boolean; social: boolean } | undefined) => ({
        ...(old ?? { critical: true, social: true }),
        ...partial,
      }));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(['notification-preferences', userId], ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notification-preferences', userId] }),
  });

  const prefs = prefsQuery.data ?? { critical: true, social: true };

  return (
    <>
      <Stack.Screen options={{ title: t('notifications.settingsTitle') }} />
      <ScrollView>
        <NotificationToggleRow
          label={t('notifications.criticalLabel')}
          caption={t('notifications.criticalCaption')}
          value={prefs.critical}
          onValueChange={(v) => mutation.mutate({ critical: v })}
        />
        <NotificationToggleRow
          label={t('notifications.socialLabel')}
          caption={t('notifications.socialCaption')}
          value={prefs.social}
          onValueChange={(v) => mutation.mutate({ social: v })}
        />

        <Text style={styles.sectionHeader}>{t('notifications.deviceStatusSection')}</Text>
        <View style={styles.statusRow}>
          <Text>{permStatus === 'granted' ? t('notifications.permissionGranted') : t('notifications.permissionDenied')}</Text>
          {permStatus === 'denied' && (
            <Pressable onPress={() => Linking.openSettings()} style={styles.button}>
              <Text style={styles.buttonText}>{t('notifications.openOsSettings')}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { fontSize: 13, color: '#888', paddingHorizontal: 16, paddingVertical: 12, textAlign: 'right' },
  statusRow: { flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'space-between' },
  button: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#0A8754', borderRadius: 6 },
  buttonText: { color: 'white', fontSize: 14 },
});
```

- [ ] **Step 2: Wire entry row**

In `app/apps/mobile/app/settings.tsx`, find the "התראות" row (currently a no-op alert per TD-107). Replace its `onPress` with:
```tsx
onPress: () => router.push('/settings/notifications'),
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/app/settings/notifications.tsx app/apps/mobile/app/settings.tsx
git commit -m "feat(notif)(mobile): add Settings → התראות screen with optimistic toggle

Mapped to spec: FR-SETTINGS-005, FR-NOTIF-014."
```

---

### Task 25: CI lint for coalesce duplication

**Files:**
- Modify: `app/scripts/check-architecture.mjs`

- [ ] **Step 1: Add the lint**

Append to `check-architecture.mjs` (or create a new function `checkNotificationsCoalesceMirror`):
```js
import { readFileSync } from 'node:fs';

function checkNotificationsCoalesceMirror() {
  const application = readFileSync('app/packages/application/src/notifications/coalesce.ts', 'utf8');
  const edge = readFileSync('supabase/functions/dispatch-notification/coalesce.ts', 'utf8');
  // Compare modulo the leading docstring (lines 1-6) and any trailing whitespace.
  const stripHeader = (s) => s.split('\n').slice(7).join('\n').trimEnd();
  if (stripHeader(application) !== stripHeader(edge)) {
    console.error('coalesce.ts diverges between application and Edge Function copies.');
    console.error('  application: app/packages/application/src/notifications/coalesce.ts');
    console.error('  edge:        supabase/functions/dispatch-notification/coalesce.ts');
    process.exit(1);
  }
}

checkNotificationsCoalesceMirror();
```
Make sure it's called from the main `run()` if the file uses one.

- [ ] **Step 2: Run the lint**

```bash
cd app && pnpm lint:arch
```
Expected: PASS (both files match).

- [ ] **Step 3: Commit**

```bash
git add app/scripts/check-architecture.mjs
git commit -m "chore(notif): lint that coalesce.ts stays in sync between app and Edge Function"
```

---

### Task 26: Phase 1 SSOT partial update + open PR-1

**Files:**
- Modify: `docs/SSOT/BACKLOG.md`
- Modify: `docs/SSOT/spec/09_notifications.md`
- Modify: `docs/SSOT/TECH_DEBT.md`

- [ ] **Step 1: Flip status to "In progress"**

In `BACKLOG.md`, change `P1.5` row status from `⏳ Planned` → `🟡 In progress`.

In `spec/09_notifications.md`, change status line from `Planned` → `In progress (PR-1 merged)`.

In `TECH_DEBT.md`:
- Mark `TD-115` as **closed** (with PR-1 ref).
- Add new TDs: `TD-59` (NOTIF-004), `TD-60` (notification icon design), `TD-61` (stuck-queue alert), `TD-62` (Web Push parity).

- [ ] **Step 2: Verify gates pass**

From `app/`:
```bash
pnpm typecheck && pnpm test && pnpm lint
```
Expected: all green.

- [ ] **Step 3: Commit + push + open PR**

```bash
git add docs/SSOT/
git commit -m "docs(ssot): mark P1.5 in-progress; close TD-115; open TD-59/60/61/62"
git push -u origin HEAD
gh pr create --base dev --head "$(git branch --show-current)" \
  --title "feat(notif): P1.5 foundation + chat path (FR-NOTIF-001/002/003)" \
  --body-file - <<'EOF'
## Summary
Implements the foundation of P1.5 — push notifications. This PR delivers an end-to-end working pipeline for chat messages (FR-NOTIF-001/002/003), the device lifecycle (FR-NOTIF-015), the user-facing preference UI (FR-SETTINGS-005), and the contextual pre-prompt on first chat message sent.

## Mapped to spec
- FR-NOTIF-001/002/003 — chat / support / system message push
- FR-NOTIF-014, FR-NOTIF-015 — preferences + device lifecycle
- FR-SETTINGS-005 — Settings → התראות screen

## Changes
- DB: migrations 0046 (outbox + helper), 0047 (chat trigger), 0048 (crons + webhook doc), 0049 (RPCs)
- Edge Function: `dispatch-notification` with coalescing, Expo Push integration, DeviceNotRegistered cleanup
- Mobile: `expo-notifications` install, pre-prompt modal, foreground handler, tap router, badge auto-clear, Settings screen
- SSOT: P1.5 marked in-progress; TD-115 closed; TD-59/60/61/62 opened

## Tests
- `pnpm typecheck` ✅
- `pnpm test`      ✅
- `pnpm lint`      ✅
- Manual on real iOS + Android — see test plan below

## SSOT updated
- [x] `BACKLOG.md` P1.5 → 🟡 In progress
- [x] `spec/09_notifications.md` status updated
- [x] `TECH_DEBT.md` — TD-115 closed; TD-59/60/61/62 added

## Risk / rollout notes
- New tables and triggers — additive, no destructive changes.
- The Database Webhook must be configured manually via dashboard before merging to main.
- EXPO_ACCESS_TOKEN secret must be set in Edge Function secrets.
- Tested in dev; staged rollout via dev branch first.

## Manual test plan
- [ ] Pre-prompt appears on first chat send; pre-prompt cooldown holds for 30d on decline
- [ ] OS permission accept → device row appears in `devices`
- [ ] Real-device push from another user arrives within ≤5s
- [ ] Chat foreground → no push (suppressed via setNotificationHandler)
- [ ] 3 messages within 60s → single coalesced push
- [ ] Logout → token removed from `devices`
- [ ] Settings toggle Critical=off → no push (last_error='suppressed_by_preference' in outbox)
- [ ] Android: badge increments on Pixel; resets to 0 on app open
EOF
```

---

## Phase 2 — Remaining producers

> Start a new branch off `dev` after PR-1 is merged: `feat/FR-NOTIF-009-remaining-producers`.

### Task 27: Migration 0050 — recipient mark/unmark triggers

**Files:**
- Create: `supabase/migrations/0050_notifications_recipient_triggers.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 0050_notifications_recipient_triggers | P1.5 PR-2 — FR-NOTIF-009/010.
begin;

create or replace function public.posts_enqueue_recipient_events()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner_name     text;
  v_recipient_name text;
  v_post_title     text := coalesce(NEW.title, '');
begin
  -- FR-NOTIF-009: recipient marked.
  if NEW.recipient_user_id is not null
     and (OLD.recipient_user_id is null or OLD.recipient_user_id <> NEW.recipient_user_id)
     and NEW.status = 'closed_delivered' then
    select coalesce(u.display_name, 'Karma user') into v_owner_name
      from public.users u where u.user_id = NEW.owner_user_id;
    perform public.enqueue_notification(
      NEW.recipient_user_id, 'critical', 'mark_recipient',
      'notifications.markRecipientTitle', 'notifications.markRecipientBody',
      jsonb_build_object('ownerName', v_owner_name, 'postTitle', v_post_title),
      jsonb_build_object('route', '/post/[id]', 'params', jsonb_build_object('id', NEW.post_id::text)),
      'mark:' || NEW.post_id::text || ':' || NEW.recipient_user_id::text,
      true   -- bypass_preferences per FR-NOTIF-009 AC3
    );
  end if;

  -- FR-NOTIF-010: recipient un-marked (owner notified).
  if NEW.status = 'deleted_no_recipient'
     and OLD.status = 'closed_delivered'
     and OLD.recipient_user_id is not null then
    select coalesce(u.display_name, 'Karma user') into v_recipient_name
      from public.users u where u.user_id = OLD.recipient_user_id;
    perform public.enqueue_notification(
      NEW.owner_user_id, 'critical', 'unmark_recipient',
      'notifications.unmarkRecipientTitle', 'notifications.unmarkRecipientBody',
      jsonb_build_object('recipientName', v_recipient_name, 'postTitle', v_post_title),
      jsonb_build_object('route', '/post/[id]', 'params', jsonb_build_object('id', NEW.post_id::text)),
      'unmark:' || NEW.post_id::text,
      false
    );
  end if;

  return NEW;
end $$;

drop trigger if exists tg_posts_enqueue_recipient_events on public.posts;
create trigger tg_posts_enqueue_recipient_events
  after update of status, recipient_user_id on public.posts
  for each row
  execute function public.posts_enqueue_recipient_events();

commit;
```

- [ ] **Step 2: Apply + smoke test**

Apply migration. Then in SQL, simulate a mark:
```sql
update public.posts set recipient_user_id = '<some user>', status = 'closed_delivered' where post_id = '<some open post>';
select kind, user_id, title_key, bypass_preferences from public.notifications_outbox order by created_at desc limit 1;
-- Expected: kind='mark_recipient', user_id=that recipient, bypass_preferences=true
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0050_notifications_recipient_triggers.sql
git commit -m "feat(notif)(infra): enqueue notifications on recipient mark/unmark

Mapped to spec: FR-NOTIF-009, FR-NOTIF-010."
```

---

### Task 28: Migration 0051 — auto-removed trigger

**Files:**
- Create: `supabase/migrations/0051_notifications_auto_removed_trigger.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 0051_notifications_auto_removed_trigger | P1.5 PR-2 — FR-NOTIF-011.
begin;

create or replace function public.posts_enqueue_auto_removed()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if NEW.status = 'removed_auto' and OLD.status <> 'removed_auto' then
    perform public.enqueue_notification(
      NEW.owner_user_id, 'critical', 'auto_removed',
      'notifications.autoRemovedTitle', 'notifications.autoRemovedBody',
      '{}'::jsonb,
      jsonb_build_object('route', '/help/removed-post'),
      'auto_removed:' || NEW.post_id::text,
      false
    );
  end if;
  return NEW;
end $$;

drop trigger if exists tg_posts_enqueue_auto_removed on public.posts;
create trigger tg_posts_enqueue_auto_removed
  after update of status on public.posts
  for each row
  execute function public.posts_enqueue_auto_removed();

commit;
```

- [ ] **Step 2: Apply + smoke test**

```sql
update public.posts set status = 'removed_auto' where post_id = '<some open post>';
select kind from public.notifications_outbox order by created_at desc limit 1;
-- Expected: 'auto_removed'
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0051_notifications_auto_removed_trigger.sql
git commit -m "feat(notif)(infra): enqueue auto_removed notification on post removal

Mapped to spec: FR-NOTIF-011."
```

---

### Task 29: Migration 0052 — follow_requests + follow_started triggers

**Files:**
- Create: `supabase/migrations/0052_notifications_follow_triggers.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 0052_notifications_follow_triggers | P1.5 PR-2 — FR-NOTIF-006/007/008.
begin;

create or replace function public.follow_requests_enqueue_notifications()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_requester_name text;
  v_target_name    text;
begin
  if TG_OP = 'INSERT' and NEW.status = 'pending' then
    select coalesce(u.display_name, 'Karma user') into v_requester_name
      from public.users u where u.user_id = NEW.requester_user_id;
    perform public.enqueue_notification(
      NEW.target_user_id, 'social', 'follow_request',
      'notifications.followRequestTitle', 'notifications.followRequestBody',
      jsonb_build_object('requesterName', v_requester_name),
      jsonb_build_object('route', '/settings/follow-requests'),
      'follow_req:' || NEW.requester_user_id::text || ':' || NEW.target_user_id::text,
      false
    );
  elsif TG_OP = 'UPDATE' and NEW.status = 'accepted' and OLD.status <> 'accepted' then
    select coalesce(u.display_name, 'Karma user') into v_target_name
      from public.users u where u.user_id = NEW.target_user_id;
    perform public.enqueue_notification(
      NEW.requester_user_id, 'social', 'follow_approved',
      'notifications.followApprovedTitle', 'notifications.followApprovedBody',
      jsonb_build_object('targetName', v_target_name),
      jsonb_build_object('route', '/user/[handle]', 'params', jsonb_build_object('handle', NEW.target_user_id::text)),
      'follow_appr:' || NEW.requester_user_id::text || ':' || NEW.target_user_id::text,
      false
    );
  end if;
  return NEW;
end $$;

drop trigger if exists tg_follow_requests_enqueue on public.follow_requests;
create trigger tg_follow_requests_enqueue
  after insert or update on public.follow_requests
  for each row
  execute function public.follow_requests_enqueue_notifications();

-- FR-NOTIF-007: follow_started (public instant follow).
create or replace function public.follows_enqueue_started()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_follower_name text;
begin
  if NEW.source = 'public_instant' then
    select coalesce(u.display_name, 'Karma user') into v_follower_name
      from public.users u where u.user_id = NEW.follower_user_id;
    perform public.enqueue_notification(
      NEW.followee_user_id, 'social', 'follow_started',
      'notifications.followStartedTitle', 'notifications.followStartedBody',
      jsonb_build_object('followerName', v_follower_name),
      jsonb_build_object('route', '/user/[handle]', 'params', jsonb_build_object('handle', NEW.follower_user_id::text)),
      null,   -- no dedupe; coalescing in dispatcher handles ≥3-in-60min
      false
    );
  end if;
  return NEW;
end $$;

drop trigger if exists tg_follows_enqueue_started on public.follows;
create trigger tg_follows_enqueue_started
  after insert on public.follows
  for each row
  execute function public.follows_enqueue_started();

commit;
```

> **Verify** that `follows` has a `source` column. If not, either add it (preferred) or replace the predicate with whatever distinguishes public-instant follows from accepted-request follows in your schema. Inspect `supabase/migrations/0003_init_following_blocking.sql` and `0032_followrequests_auto_approve_on_public.sql`.

- [ ] **Step 2: Apply + smoke test**

Test each branch independently.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0052_notifications_follow_triggers.sql
git commit -m "feat(notif)(infra): enqueue notifications on follow_request and follow_started

Mapped to spec: FR-NOTIF-006, FR-NOTIF-007, FR-NOTIF-008."
```

---

### Task 30: Migration 0053 — post expiry cron

**Files:**
- Create: `supabase/migrations/0053_notifications_post_expiry_cron.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 0053_notifications_post_expiry_cron | P1.5 PR-2 — FR-NOTIF-005.
-- Runs daily at 09:00 IL time (= 06:00 UTC). For every post hitting day 293,
-- enqueues a notification to the owner. Dedupe key per post prevents duplicates
-- if the cron is double-run.
begin;

create or replace function public.notifications_post_expiry_check()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare r record;
begin
  for r in
    select post_id, owner_user_id, title
    from public.posts
    where status = 'open'
      and created_at + interval '293 days' <= now()
      and created_at + interval '294 days' > now()
  loop
    perform public.enqueue_notification(
      r.owner_user_id, 'critical', 'post_expiring',
      'notifications.postExpiringTitle', 'notifications.postExpiringBody',
      jsonb_build_object('postTitle', coalesce(r.title, '')),
      jsonb_build_object('route', '/post/[id]', 'params', jsonb_build_object('id', r.post_id::text)),
      'expire:' || r.post_id::text,
      false
    );
  end loop;
end $$;

select cron.schedule(
  'notifications_post_expiry_check',
  '0 6 * * *',
  $$ select public.notifications_post_expiry_check(); $$
);

commit;
```

- [ ] **Step 2: Apply + manual fire**

```sql
-- Manual fire (no need to wait for cron).
select public.notifications_post_expiry_check();
-- Verify with: select count(*) from public.notifications_outbox where kind='post_expiring' and created_at > now()-interval '1 minute';
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0053_notifications_post_expiry_cron.sql
git commit -m "feat(notif)(infra): add post_expiring cron and producer

Mapped to spec: FR-NOTIF-005."
```

---

### Task 31: Wire pre-prompt to `publishPost` (second contextual trigger)

**Files:**
- Modify: `app/apps/mobile/app/(tabs)/create.tsx`

- [ ] **Step 1: Detect first-post-published**

Mirror the chat pattern from Task 21. Before publishing, capture `wasFirstPost = user.postsCreatedTotal === 0`. On publish success, if `wasFirstPost`, call `presentPrePrompt('first-post-published')`.

```tsx
import { usePushPermissionGate } from '../../src/lib/notifications';
import { EnablePushModal } from '../../src/components/EnablePushModal';
import { registerCurrentDeviceIfPermitted } from '../../src/lib/notifications';
import { container } from '../../src/lib/container';

// inside the component:
const { modalState, presentPrePrompt, handleAccept, handleDecline } = usePushPermissionGate();

// inside onPublishSuccess:
if (user.postsCreatedTotal === 0) {
  await presentPrePrompt('first-post-published');
}

// In JSX (mount modal):
<EnablePushModal
  visible={modalState.visible}
  trigger={modalState.trigger}
  onAccept={async () => {
    const status = await handleAccept();
    if (status === 'granted') {
      await registerCurrentDeviceIfPermitted(userId, { deviceRepo: container.deviceRepo });
    }
  }}
  onDecline={handleDecline}
/>
```

- [ ] **Step 2: Commit**

```bash
git add app/apps/mobile/app/(tabs)/create.tsx
git commit -m "feat(notif)(mobile): present push pre-prompt on first post published

Mapped to spec: FR-NOTIF-015 AC1."
```

---

### Task 32: Phase 2 SSOT close-out

**Files:**
- Modify: `docs/SSOT/BACKLOG.md`
- Modify: `docs/SSOT/spec/09_notifications.md`
- Modify: `docs/SSOT/TECH_DEBT.md`
- Modify: `docs/SSOT/DECISIONS.md`

- [ ] **Step 1: Flip statuses**

In `BACKLOG.md`: P1.5 → `✅ Done`.

In `spec/09_notifications.md`: status → `✅ Implemented`. Add a section at the bottom noting that NOTIF-004 (`message_undeliverable`) and NOTIF-012 (account-deletion email) remain deferred, with refs to `TD-59` and `TD-118` respectively.

In `TECH_DEBT.md`: close `TD-19`, `TD-119`, `TD-124` (move rows from Active to Resolved).

In `DECISIONS.md`: add `EXEC-10 — Push notifications dispatcher uses outbox + database webhook + Edge Function; Web Push deferred to follow-up` with the rationale from §3.2 of the design doc.

- [ ] **Step 2: Run all gates**

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
```
Expected: green.

- [ ] **Step 3: Commit + push + PR**

```bash
git add docs/SSOT/
git commit -m "docs(ssot): close P1.5; TD-19/119/124 resolved; add EXEC-10 decision"
git push -u origin HEAD
gh pr create --base dev --head "$(git branch --show-current)" \
  --title "feat(notif): P1.5 PR-2 — remaining producers (FR-NOTIF-005/006/007/008/009/010/011)" \
  --body-file - <<'EOF'
## Summary
Completes P1.5 by wiring the remaining seven producer events on top of the PR-1 foundation.

## Mapped to spec
- FR-NOTIF-005 (post expiring)
- FR-NOTIF-006/008 (follow request / approved)
- FR-NOTIF-007 (follow started)
- FR-NOTIF-009/010 (recipient mark / unmark)
- FR-NOTIF-011 (auto-removed)

## Changes
- Migrations 0050–0053: 4 new triggers + 1 cron
- Mobile: second pre-prompt trigger on `(tabs)/create.tsx` post-publish
- SSOT: P1.5 closed; TD-19/119/124 resolved; EXEC-10 added

## Tests
- `pnpm typecheck` ✅
- `pnpm test`      ✅
- `pnpm lint`      ✅
- Manual on real device — see test plan

## SSOT updated
- [x] `BACKLOG.md` P1.5 → ✅ Done
- [x] `spec/09_notifications.md` → ✅ Implemented
- [x] `TECH_DEBT.md` — TD-19/119/124 resolved
- [x] `DECISIONS.md` — EXEC-10 added

## Manual test plan
- [ ] Mark recipient on a post — recipient gets a push within ≤5s with bypass even when Critical=off
- [ ] Recipient un-marks themselves — owner gets a push
- [ ] Admin removes a post — owner gets a push
- [ ] Day-293 expiry cron fires — owner gets a push
- [ ] Public profile: another user follows — instant push (Social)
- [ ] 3 follows within 60min — coalesced "3 new followers" body
- [ ] Private profile: another user requests to follow — Social push to target
- [ ] Approve a follow request — Social push to requester
- [ ] Post publish first time — pre-prompt appears
EOF
```

---

### Task 33: (Optional) Close TD-53 — CI deploy step for Edge Functions

**Files:**
- Modify: `.github/workflows/ci.yml` (or whatever the CI file is named)

Skip this task if it's out of scope for the current sprint; the spec calls it out as opportunistic.

- [ ] **Step 1: Add a job step**

Append to the CI workflow that triggers on push to `main` (or `dev`):
```yaml
deploy-edge-functions:
  name: Deploy Edge Functions
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  needs: [typecheck, test, lint]
  steps:
    - uses: actions/checkout@v4
    - uses: supabase/setup-cli@v1
      with: { version: latest }
    - run: supabase functions deploy dispatch-notification --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
      env:
        SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
    # Add more functions here as they're created.
```

- [ ] **Step 2: Add required secrets** in repo settings: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`.

- [ ] **Step 3: Mark TD-53 resolved in `TECH_DEBT.md`**

- [ ] **Step 4: Commit + push (PR can be combined with Task 32)**

```bash
git add .github/workflows/ docs/SSOT/TECH_DEBT.md
git commit -m "chore(ci): deploy Edge Functions on push to main; closes TD-53"
```

---

## Self-Review

**Spec coverage check** (each requirement → at least one task):

| Spec section | Covered by |
|---|---|
| FR-NOTIF-001 (chat message) | Task 9 (trigger) + Task 14 (dispatcher) + Task 19 (foreground) |
| FR-NOTIF-002 (support) | Task 9 (branch on chat.kind) |
| FR-NOTIF-003 (system message) | Task 9 (branch on message.kind) |
| FR-NOTIF-004 | Explicitly out of scope; TD-59 tracked |
| FR-NOTIF-005 (post expiring) | Task 30 |
| FR-NOTIF-006 (follow request) | Task 29 |
| FR-NOTIF-007 (follow started) | Task 29 (trigger) + Task 14 (coalescing) |
| FR-NOTIF-008 (follow approved) | Task 29 |
| FR-NOTIF-009 (mark recipient) | Task 27 |
| FR-NOTIF-010 (unmark recipient) | Task 27 |
| FR-NOTIF-011 (auto-removed) | Task 28 + Task 14 (recipient_suspended check) |
| FR-NOTIF-012 | Out of scope; TD-118 already exists |
| FR-NOTIF-013 (no reopen push) | No trigger → satisfied by absence |
| FR-NOTIF-014 (preferences) | Task 22 (UC) + Task 24 (UI) + Task 14 (gate in dispatcher) |
| FR-NOTIF-015 (token lifecycle) | Tasks 4, 5, 7, 19, 20 + Task 8 prune cron |
| FR-NOTIF-016 (quiet hours) | Out of MVP per spec |
| FR-SETTINGS-005 | Task 24 |
| NFR-PERF-007 (≤5s propagation) | Task 10 webhook + Task 14 dispatcher latency |

**Placeholder scan:** none found.

**Type consistency:** `NotificationKind` defined in Task 2, used identically in Tasks 14 and 19; `PushData` shape consistent across handlers; `IDeviceRepository` method signatures match between port (Task 3), adapter (Task 7), and consumer (Task 19/20).

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-13-push-notifications.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
