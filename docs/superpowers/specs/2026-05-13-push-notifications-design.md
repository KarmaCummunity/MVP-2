# Push Notifications — End-to-End Design (P1.5)

> **Status:** Draft for PM review
> **Date:** 2026-05-13
> **Scope:** Maps to all of `docs/SSOT/spec/09_notifications.md` (`FR-NOTIF-001..016`) and `FR-SETTINGS-005`. Closes `TD-19`, `TD-115`, `TD-119`, `TD-124` (and optionally `TD-53`).
> **Out of scope (deferred to follow-up TDs):** Web Push parity, `FR-NOTIF-004` (message-undeliverable), `FR-NOTIF-012` (account-deletion confirmation email), `FR-NOTIF-016` (quiet hours — explicitly out of MVP per spec).

---

## 1. Goals & non-goals

### Goals

1. Ship a fully working push-notification pipeline on iOS and Android for all 11 in-scope notification kinds.
2. Honor every acceptance criterion in `spec/09_notifications.md` for the in-scope FRs (`001`, `002`, `003`, `005`, `006`, `007`, `008`, `009`, `010`, `011`, `013`, `014`, `015`).
3. Meet `NFR-PERF-007` — push reaches the device within ≤5 seconds of the originating event under normal load.
4. Implement Settings → התראות screen for the two-toggle preference UI (`FR-SETTINGS-005`).
5. Close upstream tech debt (`TD-115`, `TD-119`, `TD-124`) that today says "depends on P1.5".

### Non-goals

- **Web Push (PWA / VAPID / Service Worker).** Tracked separately as a new TD; revisited after mobile lands.
- **`FR-NOTIF-004`** (`message_undeliverable`). Requires non-trivial sender-side detection of recipient account state. New TD.
- **`FR-NOTIF-012`** (account-deletion confirmation email). Already deferred per `R-MVP-Privacy-6` and project memory rule "no outbound email/SMS".
- **`FR-NOTIF-016`** (quiet hours). Out of MVP per spec.
- **OS-level interactive quick actions** (Approve/Reject from the lock screen for follow requests, `FR-NOTIF-006 AC2` "where supported"). Treated as best-effort: the OS will group the notification under a category, and on iOS/Android we add buttons only if it costs zero extra back-end work. If it doesn't, defer to a polish TD.
- **External observability (Grafana, alerting).** Use Supabase Functions logs + outbox table queries for now. New TD covers an operational stuck-queue alert.

---

## 2. Product decisions (PM-locked)

| # | Decision | Rationale |
|---|---|---|
| **D-N1** | Mobile-only (iOS + Android via Expo Push). Web Push deferred. | Web Push adoption in similar apps is low; mechanism is shared and can be added later by swapping the adapter. |
| **D-N2** | Permission prompt: in-app pre-prompt modal, triggered contextually on (a) first chat message sent, (b) first post published. 30-day cooldown on denial. | Industry standard (WhatsApp/Twitter pattern). Avoids burning the one-shot OS prompt prematurely. |
| **D-N3** | Badge = count of all unseen push notifications across categories. Increments per push, resets on `AppState='active'`. | Maximum signal. Acceptable inaccuracy when OS coalesces. |
| **D-N4** | Two notification categories (`critical`, `social`) — no per-event control. Both default `on`. | Already locked by `D-5`; this design implements it. |

A new entry will be added to `docs/SSOT/DECISIONS.md` summarizing D-N1..D-N4 plus the outbox+webhook architecture choice, as `EXEC-10`.

---

## 3. Architecture overview

### 3.1 Components

```
┌──────────────────────────────────────────────────────────────────┐
│                       Mobile client (Expo)                        │
│                                                                   │
│  ┌─────────────┐  ┌──────────────────┐  ┌────────────────────┐  │
│  │ pre-prompt  │  │  device register │  │  foreground gate / │  │
│  │   modal     │  │  / deactivate    │  │  tap router        │  │
│  └─────────────┘  └──────────────────┘  └────────────────────┘  │
│         │                  │                       ▲             │
│         ▼                  ▼                       │             │
│   OS permission     `devices` upsert         OS notification     │
└──────────────────────────────────────────────────────────────────┘
                          │                          ▲
                          ▼                          │
┌──────────────────────────────────────────────────────────────────┐
│                          Supabase                                 │
│                                                                   │
│   ┌──────────────┐  enqueue  ┌─────────────────────┐             │
│   │ DB triggers  │──────────▶│ notifications_outbox│             │
│   │ (11 sources) │           │   (queue table)     │             │
│   └──────────────┘           └─────────────────────┘             │
│                                       │                           │
│                                       │ Database Webhook on INSERT│
│                                       ▼                           │
│                       ┌──────────────────────────────┐           │
│                       │ Edge Function:               │           │
│                       │   dispatch-notification      │           │
│                       └──────────────────────────────┘           │
└──────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼ HTTPS
                          ┌─────────────────────────┐
                          │ Expo Push Service       │
                          │  (proxies APNs + FCM)   │
                          └─────────────────────────┘
                                       │
                                       ▼
                                   device OS
```

### 3.2 Why this shape

| Choice | Why | Rejected alternatives |
|---|---|---|
| **Outbox table + Database Webhook → Edge Function** | Atomic with the originating transaction; ~0.5–1.5s latency; built-in webhook retries; clear observability via the outbox row. | `pg_net.http_post` inside trigger (HTTP in transaction is fragile, no retries, secrets in DB); `pg_cron` polling (Supabase managed minimum is 1 min — breaks ≤5s SLO for chat); external worker on Railway (extra service to operate). |
| **Expo Push Service** as transport | Already in the stack (Expo SDK 54). Free. Handles APNs + FCM token registration server-side. | Direct FCM + APNs (doubles work, requires server certs); third-party (OneSignal — extra DPA + dependency). |
| **Server-side fan-out, client-side suppression** | "Active in chat" is naturally a client concept (which screen is mounted). Tracking presence server-side would require heartbeats. | Realtime presence (over-engineered for one suppression rule). |
| **Coalescing in dispatcher, not in DB** | Dispatcher already has all context (user prefs, devices, recent dispatches). DB-side coalescing duplicates this logic. | DB `on conflict ... do update` (forces shape; harder to reason about for two different windows — 60s vs 60min). |

---

## 4. Data model (migration `0046_notifications.sql`)

### 4.1 New table: `notifications_outbox`

| Column | Type | Notes |
|---|---|---|
| `notification_id` | `uuid PK default gen_random_uuid()` | |
| `user_id` | `uuid not null references users(user_id) on delete cascade` | recipient |
| `category` | `text not null check (category in ('critical','social'))` | |
| `kind` | `text not null` | one of: `chat_message`, `support_message`, `system_message`, `post_expiring`, `mark_recipient`, `unmark_recipient`, `auto_removed`, `follow_request`, `follow_started`, `follow_approved` |
| `title_key` | `text not null` | i18n key (e.g. `notifications.chatTitle`) |
| `body_key` | `text not null` | i18n key |
| `body_args` | `jsonb not null default '{}'::jsonb` | interpolation args |
| `data` | `jsonb not null default '{}'::jsonb` | tap-routing payload — `{ route: "/chat/[id]", params: {...}, chat_id? }` |
| `dedupe_key` | `text` | optional; unique partial index prevents duplicates within a window |
| `bypass_preferences` | `boolean not null default false` | true only for `mark_recipient` / `unmark_recipient` per `FR-NOTIF-009 AC3` / `FR-NOTIF-010` |
| `created_at` | `timestamptz not null default now()` | |
| `dispatched_at` | `timestamptz` | null = pending |
| `attempts` | `int not null default 0` | |
| `last_error` | `text` | |
| `expires_at` | `timestamptz not null default (now() + interval '7 days')` | TTL — cron deletes |

**Indexes:**

- `(user_id, created_at desc)` — for coalescing lookups
- `(dispatched_at) where dispatched_at is null` — partial, for retry sweeper
- `(dedupe_key) where dedupe_key is not null` — unique partial
- `(expires_at)` — for TTL cleanup

**RLS:** none for `authenticated` (the table is service-only). `grant insert on notifications_outbox to service_role` only.

### 4.2 Existing table: `devices`

No structural change. The existing `push_token` column carries the Expo token value (`ExponentPushToken[...]`). `platform` column already exists (`'ios'` / `'android'` / `'web'`). RLS self-only already permits the client to insert / delete its own rows.

### 4.3 New helper function: `enqueue_notification(...)`

Used by every producer trigger:

```sql
create or replace function public.enqueue_notification(
  p_user_id uuid,
  p_category text,
  p_kind text,
  p_title_key text,
  p_body_key text,
  p_body_args jsonb default '{}'::jsonb,
  p_data jsonb default '{}'::jsonb,
  p_dedupe_key text default null,
  p_bypass_preferences boolean default false
) returns uuid
language plpgsql security definer
set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  if p_user_id is null then return null; end if;
  -- self-suppression: don't notify the actor of their own action
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
```

### 4.4 Producer triggers (all in `0046`)

| # | FR | Trigger name | Source table / event | Notes |
|---|---|---|---|---|
| 1 | `001`/`002`/`003` | `tg_messages_enqueue_notification` | `messages` AFTER INSERT | branches on `kind` (`user` → chat_message; `system` → system_message); on `chat.kind='admin_support'` swaps to `support_message`; dedupe `chat:<chat_id>:<sender_id>:<floor(epoch/60)>` |
| 2 | `005` | `notifications_post_expiry_check` | pg_cron daily 09:00 IL time | `select enqueue_notification(...) from posts where status='open' and created_at + interval '293 days' <= now() and created_at + interval '294 days' > now()` |
| 3 | `009` / `010` | `tg_posts_enqueue_recipient_events` | `posts` AFTER UPDATE | `mark` when `recipient_user_id` transitioned null→not-null and status='closed_delivered'; `unmark` when status transitioned closed_delivered→deleted_no_recipient and recipient_user_id was set previously |
| 4 | `011` | `tg_posts_enqueue_auto_removed` | `posts` AFTER UPDATE | when status changed to `removed_auto` |
| 5 | `006` / `008` | `tg_follow_requests_enqueue` | `follow_requests` AFTER INSERT / AFTER UPDATE | INSERT (status='pending') → `follow_request` to target; UPDATE (status→'accepted') → `follow_approved` to requester |
| 6 | `007` | `tg_follows_enqueue_started` | `follows` AFTER INSERT | only when `source='public_instant'` (i.e. not via accepted request) |

**No trigger for `013`** — reopen explicitly produces no notification per spec.

### 4.5 Cron jobs (also in `0046`)

| Name | Schedule | Purpose |
|---|---|---|
| `notifications_post_expiry_check` | `0 6 * * *` (09:00 IL = 06:00 UTC) | Enqueue 7-day-before-expiry warnings (`FR-NOTIF-005`) |
| `notifications_retry_pending` | `* * * * *` (every minute) | For each `(notification_id, user_id)` with `dispatched_at IS NULL AND attempts < 3 AND created_at > now() - interval '1 hour'`, fire the Edge Function via `supabase_functions.http_request` |
| `notifications_outbox_ttl` | `0 4 * * *` (daily 04:00 UTC) | `DELETE FROM notifications_outbox WHERE expires_at < now()` |
| `notifications_token_prune` | `0 4 * * *` | `DELETE FROM devices WHERE last_seen_at < now() - interval '90 days'` (`FR-NOTIF-015 AC4`) |

### 4.6 Database webhook

Created at the end of `0046` via Supabase's `supabase_functions` schema helper:

```sql
select supabase_functions.http_request(
  'POST',
  format('%s/functions/v1/dispatch-notification', current_setting('app.settings.functions_url')),
  '{"Content-Type":"application/json","Authorization":"Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
  to_jsonb(NEW)::text,
  '5000'
);
```

attached as `AFTER INSERT` trigger on `notifications_outbox`. The Edge Function endpoint validates the bearer token to reject unauthenticated calls.

---

## 5. Edge Function — `dispatch-notification`

**Location:** `supabase/functions/dispatch-notification/index.ts`

**Estimated size:** 150–180 LOC (well under the ≤200 LOC cap).

### 5.1 Flow

1. **Auth check** — reject if `Authorization` header doesn't match `SUPABASE_SERVICE_ROLE_KEY`.
2. **Parse webhook payload** — extract `record` (the outbox row).
3. **Load recipient state** — single query:
   ```sql
   select u.notification_preferences,
          coalesce(array_agg(d.push_token order by d.last_seen_at desc)
                   filter (where d.push_token is not null), '{}') as tokens
   from users u
   left join devices d on d.user_id = u.user_id
   where u.user_id = $1
   group by u.user_id;
   ```
4. **Preference gate** — if `category='critical' AND notification_preferences->>'critical'='false'` and `bypass_preferences=false`, mark `dispatched_at`, `last_error='suppressed_by_preference'`, return 200. Same for `social`.
5. **No tokens** → mark `dispatched_at`, `last_error='no_devices'`, return 200.
6. **Coalesce (chat_message, follow_started only)** — look back into outbox:
   - chat: rows with same `(user_id, kind='chat_message', data->>'chat_id')` dispatched in the past 60s → use `chatBodyCoalesced` body key with `{ count: N+1 }`.
   - follow_started: rows with same `(user_id, kind='follow_started')` dispatched in the past 60min, count ≥ 3 → use `followStartedCoalesced` body.
7. **Resolve i18n** — server-side dictionary in `i18n.json` next to `index.ts`. Single-string lookup + simple `{{var}}` interpolation.
8. **Build Expo payload** — see schema below. Use `priority: 'high'` for Critical.
9. **POST** to `https://exp.host/--/api/v2/push/send` with `Authorization: Bearer EXPO_ACCESS_TOKEN`. Up to 100 tokens per request.
10. **Process tickets:**
    - `ok` → mark `dispatched_at=now()`.
    - `DeviceNotRegistered` → `DELETE FROM devices WHERE push_token = $1`; mark `dispatched_at`.
    - `MessageRateExceeded` / network error → leave `dispatched_at=null`, `attempts+=1`, `last_error=<message>`. Cron will retry until `attempts >= 3`.
11. **Return** 200 with summary `{ tokens_attempted, tokens_succeeded, tokens_failed }`.

### 5.2 Expo Push payload (per recipient)

```json
{
  "to": ["ExponentPushToken[...]", "..."],
  "title": "<resolved title>",
  "body": "<resolved body>",
  "data": { "category": "critical", "kind": "chat_message", "notification_id": "...", "route": "/chat/[id]", "params": { "id": "..." }, "chat_id": "..." },
  "channelId": "critical",
  "threadId": "chat:<chat_id>",
  "priority": "high",
  "sound": "default",
  "badge": 1
}
```

`threadId` enables iOS visual grouping. `channelId` matches Android channels created on first launch (`critical`, `social`).

### 5.3 Files

```
supabase/functions/dispatch-notification/
  index.ts           # main handler — see Flow
  i18n.json          # ~25 string dictionary
  expoPushClient.ts  # POST + ticket processing (~40 LOC)
  coalesce.ts        # chat + follow_started body building (~30 LOC)
  README.md          # how to deploy + test locally
```

> **Note on duplication.** Deno (Edge Function runtime) cannot import from a pnpm-workspace package, so the i18n dictionary and the `coalesce` helpers are copied here from their canonical home in `packages/application/src/notifications/`. A CI lint step (added to `scripts/check-architecture.mjs`) compares the two `coalesce.ts` files byte-equal modulo formatting, and the two i18n maps key-equal, failing the build on drift.

### 5.4 Secrets required

- `EXPO_ACCESS_TOKEN` — created in `expo.dev` settings; gives rate-limit headroom.
- `SUPABASE_SERVICE_ROLE_KEY` — already present.

---

## 6. Client — `apps/mobile`

### 6.1 New dependencies

```json
"expo-notifications": "~0.32",
"expo-device": "~7.0"
```

Both bundled with Expo SDK 54; only `npm install` + `prebuild --clean` needed. No native code committed (CNG workflow per `TD-9`).

### 6.2 `app.json` additions

```json
"plugins": [
  ...,
  ["expo-notifications", {
    "icon": "./assets/notification-icon.png",
    "color": "#0A8754",
    "sounds": []
  }]
]
```

Icon file: 96×96 white-on-transparent PNG. Placeholder generated from the logo for MVP; design polish tracked as a new TD.

### 6.3 New code surface

```
packages/domain/src/notifications.ts                          # PushData type, NotificationKind union
packages/application/src/notifications/
  IDeviceRepository.ts                                        # port
  RegisterDeviceUseCase.ts
  DeactivateDeviceUseCase.ts
  UpdateNotificationPreferencesUseCase.ts
  __tests__/
    RegisterDeviceUseCase.test.ts
    DeactivateDeviceUseCase.test.ts
    UpdateNotificationPreferencesUseCase.test.ts
    coalesce.test.ts (pure helpers shared with Edge Function)
packages/infrastructure-supabase/src/notifications/
  SupabaseDeviceRepository.ts
apps/mobile/src/lib/notifications/
  index.ts                                                    # registerIfPermitted, clearBadge, current screen tracker
  usePushPermissionGate.ts
  badge.ts
  foregroundHandler.ts
  tapHandler.ts
apps/mobile/src/components/
  EnablePushModal.tsx                                         # pre-prompt
  NotificationToggleRow.tsx
apps/mobile/app/settings/notifications.tsx                    # new screen
apps/mobile/src/i18n/partials/notificationsHe.ts
```

### 6.4 Permission flow

`usePushPermissionGate(trigger)` is called from:

- `app/chat/[id].tsx` — after a successful `sendMessage`, if `await chatRepo.hasSentAnyMessage(userId)` was previously false → `presentPrePrompt('first-message-sent')`.
- `app/(tabs)/create.tsx` — after a successful `publishPost`, if `user.postsCreatedTotal === 0` before publish → `presentPrePrompt('first-post-published')`.

The gate keeps state in `AsyncStorage['push_permission_state']`:
```json
{ "lastPromptAt": "...", "lastDecision": "denied|granted|pending", "osPromptShown": true }
```

Behavior:
1. If `lastPromptAt < 30 days ago` and `lastDecision='denied'` → noop.
2. Else show `<EnablePushModal>` with contextual body copy.
3. On Accept → `Notifications.requestPermissionsAsync()` → register token.
4. On Decline → store `denied` + timestamp.

### 6.5 Token registration

```ts
async function registerIfPermitted(userId: string, deps: { deviceRepo, projectId }): Promise<void> {
  if (!Device.isDevice) return;  // simulator → noop
  const perm = await Notifications.getPermissionsAsync();
  if (perm.status !== 'granted') return;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: deps.projectId });
  const platform = Platform.OS as 'ios' | 'android' | 'web';
  await new RegisterDeviceUseCase(deps.deviceRepo).execute({ userId, pushToken: token, platform });
}
```

Called from `app/_layout.tsx` `useEffect` when `userId` is non-null.

Sign-out hook → `DeactivateDeviceUseCase(token)` runs before `signOut()`.

### 6.6 Foreground handler

```ts
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as PushData;
    const activeRoute = useActiveScreenStore.getState().route;
    if (data.kind === 'chat_message' && activeRoute === `/chat/${data.chat_id}`) {
      return { shouldShowAlert: false, shouldPlaySound: false, shouldSetBadge: false };
    }
    return { shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true };
  },
});
```

`useActiveScreenStore` is a tiny zustand store updated by `useNavigationState` in `_layout.tsx`.

### 6.7 Tap routing

`tapHandler.ts` subscribes to `Notifications.addNotificationResponseReceivedListener` and calls `Notifications.getLastNotificationResponseAsync()` once at mount (cold-start case). On receipt:

```ts
function handleNotificationTap(data: PushData) {
  if (!data?.route) return;
  router.push({ pathname: data.route, params: data.params ?? {} });
}
```

Guarded by `AuthGate`: if there's no session at cold-start, the user is routed to `(auth)` first; the gate replays the pending nav after sign-in (already a pattern in the codebase per `TD-3`).

### 6.8 Badge

`badge.ts`:
```ts
async function clearBadge() { await Notifications.setBadgeCountAsync(0); }
```

`AppState` listener in `_layout.tsx` calls `clearBadge()` on transition to `active`. Increment is delegated to the OS via the `badge: 1` field in the Expo payload + the foreground handler's `shouldSetBadge: true`.

---

## 7. Settings UI — `FR-SETTINGS-005`

**Screen:** `apps/mobile/app/settings/notifications.tsx` (~120 LOC).

**Sections:**
1. **התראות** — two `NotificationToggleRow`s (קריטיות / חברתיות) with captions explaining what each category includes.
2. **סטטוס המכשיר** — read-only: permission status, token-registered status, "פתח הגדרות" button via `Linking.openSettings()` when denied.

**State:**
- `useQuery(['notification-preferences', userId])` reading `User.notificationPreferences`.
- `useMutation(UpdateNotificationPreferencesUseCase)` with optimistic update + rollback on error (per the `TD-125` pattern).

**Entry point:** the existing "התראות" row in `app/settings.tsx` (currently a no-op per `TD-107`) gets wired to `router.push('/settings/notifications')`.

---

## 8. Suppression, coalescing, and per-FR mapping

| FR | Mechanism |
|---|---|
| `FR-NOTIF-001 AC2` (chat foreground suppression) | client `setNotificationHandler` checks `activeRoute === '/chat/<chat_id>'` |
| `FR-NOTIF-001 AC3` (chat 60s coalesce) | dispatcher queries outbox for prior `chat_message` rows on same `(user, chat)` within 60s, swaps body to `chatBodyCoalesced` |
| `FR-NOTIF-001 AC4` (disabled by `notif_critical=false`) | dispatcher preference gate |
| `FR-NOTIF-002 AC1` (support title swap) | trigger checks `chats.kind='admin_support'`, swaps `title_key` to `support_message_title` |
| `FR-NOTIF-002 AC2` (no per-support suppression) | only the category toggle applies; dispatcher checks `category=critical` |
| `FR-NOTIF-004` | **deferred** — new TD |
| `FR-NOTIF-005 AC1` (exactly once on day 293) | cron + `dedupe_key='expire:<post_id>'` |
| `FR-NOTIF-005 AC3` (only if `status='open'`) | cron query filters on status |
| `FR-NOTIF-006 AC2` (OS quick actions) | Android: `iconActionButtons` via channelId category — best-effort. iOS: defer (requires `UNNotificationCategory` setup — TD if PM wants). Tap falls back to nav to `/settings/follow-requests`. |
| `FR-NOTIF-007 AC3` (3-followers-in-60min coalesce) | dispatcher counts past dispatches in 60min, uses `followStartedCoalesced` |
| `FR-NOTIF-009 AC3` (always Critical regardless of toggle) | `bypass_preferences=true` |
| `FR-NOTIF-010` | trigger detects status transition `closed_delivered → deleted_no_recipient` with prior recipient |
| `FR-NOTIF-011 AC2` (suspended users don't receive) | when dispatcher loads recipient state, if `User.account_status` indicates suspension → skip + `last_error='recipient_suspended'`. Re-evaluation on next sign-in is automatic since past outbox rows are TTL'd. |
| `FR-NOTIF-013` (no notification on reopen) | no trigger emits |
| `FR-NOTIF-014` | implemented via Settings screen + `UpdateNotificationPreferencesUseCase`; `NFR-PERF-007` met because dispatcher reads prefs fresh each call |
| `FR-NOTIF-015 AC1` (request permission, register) | `usePushPermissionGate` + `RegisterDeviceUseCase` |
| `FR-NOTIF-015 AC2` (stored under `User.devices[]`) | already implemented via `devices` table |
| `FR-NOTIF-015 AC3` (deactivate on sign-out) | `DeactivateDeviceUseCase` |
| `FR-NOTIF-015 AC4` (90-day prune) | `notifications_token_prune` cron |
| `FR-NOTIF-015 AC5` (denial recorded, reopen via OS) | `usePushPermissionGate` stores denial state; Settings screen offers `openSettings()` |

---

## 9. Tests

### 9.1 Unit (vitest)

- `RegisterDeviceUseCase.test.ts` — happy path; reassign token to a different user; invalid input throws ValidationError.
- `DeactivateDeviceUseCase.test.ts` — happy; missing token = noop.
- `UpdateNotificationPreferencesUseCase.test.ts` — partial merge; concurrent update doesn't reset the other field.
- `coalesce.test.ts` — chat 1 / 2 / N messages; follow_started thresholds at 2 / 3 / 5. Covers the copy in `packages/application/src/notifications/coalesce.ts`; the Edge Function copy is enforced byte-equal by the CI lint described in §5.3.
- `usePushPermissionGate.test.ts` — cooldown logic; first-trigger detection.

### 9.2 SQL (vitest under `@kc/infrastructure-supabase`)

- `enqueue_notification` — happy; self-suppression; dedupe `on conflict do nothing`.
- `tg_messages_enqueue_notification` — user message → outbox row for recipient only; system message → outbox row for the chat owner; sender messages don't self-notify.
- `tg_posts_enqueue_recipient_events` — mark transition; un-mark transition; no-op when neither.
- `notifications_post_expiry_check` cron query — only fires on day 293; skips closed/removed posts.

### 9.3 Manual (PR test plan)

Per real-device matrix (one iOS, one Android), each PR's checklist:
1. Pre-prompt appears on first chat send / first post publish.
2. OS permission granted → device row appears in `devices`.
3. Sending a message to another test user → push within ≤5s; tap → opens the chat.
4. Chat foreground while message arrives → no push.
5. 3 messages within 60s → single coalesced push.
6. Mark-as-recipient → push even with Critical toggle off.
7. Logout → token deactivated; re-login → re-registered.
8. Toggle Critical off in Settings → message send produces no push (verifiable via outbox `last_error='suppressed_by_preference'`).

---

## 10. Observability

- **Live queue health:** `select count(*) from notifications_outbox where dispatched_at is null and created_at < now() - interval '5 minutes'` should always return 0 under normal load.
- **Latency:** `select kind, percentile_cont(0.5) within group (order by extract(epoch from dispatched_at - created_at)) as p50, percentile_cont(0.95) within group (...) as p95 from notifications_outbox where created_at > now() - interval '1 day' group by kind`.
- **Failure modes:** `select kind, last_error, count(*) from notifications_outbox where attempts >= 3 group by kind, last_error`.
- **Edge Function logs** retained 7 days in Supabase dashboard.
- **No external alerting** in MVP — new TD covers a stuck-queue Slack/email alert.

---

## 11. Rollout plan

### 11.1 Pre-requisites (one-time)

1. `eas init` inside `apps/mobile/` → adds `expo.extra.eas.projectId` to `app.json`.
2. Create `EXPO_ACCESS_TOKEN` in expo.dev → add as Edge Function secret.
3. Confirm `pg_net` and `supabase_functions` extensions enabled (likely already on; verify via `list_extensions`).
4. Deploy `dispatch-notification` Edge Function. **Recommend closing `TD-53` in the same PR** by adding the CI deploy step for Edge Functions on push to `main` (touches `supabase/functions/**`).

### 11.2 Slicing

**Recommendation: two PRs** to reduce blast radius. Both target `dev`; merge to `main` only after each is validated on real devices.

- **PR-1 — Foundation + chat path**
  - Migration `0046` with: outbox table + `enqueue_notification` helper + chat message trigger (FR-NOTIF-001/002/003) + DB webhook + retry cron + TTL cron + token prune cron.
  - Edge Function `dispatch-notification` (full implementation).
  - Client: `expo-notifications` install + prebuild + token lifecycle + pre-prompt (chat trigger only) + foreground handler + tap router + badge.
  - Settings → התראות screen.
  - Closes: `TD-115`. Partial close of `TD-19`.
  - Validates the entire pipeline end-to-end with the most-used producer.

- **PR-2 — Remaining producers**
  - New triggers for mark/unmark/auto-removed/post-expiring/follow-* (FR-NOTIF-005/006/007/008/009/010/011).
  - Pre-prompt on first-post-published (the second contextual trigger).
  - Closes: `TD-19` (fully), `TD-119`, `TD-124`.

### 11.3 Backout

- If a producer trigger misfires in production, `drop trigger <name>` is a single SQL statement — the outbox table and dispatcher keep working for other producers.
- If the dispatcher misbehaves: disable the database webhook (one `update`); outbox rows pile up but nothing breaks; fix and re-enable.
- If the entire feature regresses: `delete from devices` halts all pushes safely; users see the in-app status revert to "not registered" and can re-enable.

---

## 12. SSOT updates (to be made by the implementing PR)

| File | Change |
|---|---|
| `docs/SSOT/BACKLOG.md` | P1.5 status → ✅ Done (after PR-2) |
| `docs/SSOT/spec/09_notifications.md` | header status → ✅ Implemented; add notes that `FR-NOTIF-004` and `FR-NOTIF-012` remain deferred with links to new TDs |
| `docs/SSOT/spec/11_settings.md` | `FR-SETTINGS-005` status → ✅ |
| `docs/SSOT/TECH_DEBT.md` | Close `TD-19`, `TD-115`, `TD-119`, `TD-124`. Open `TD-59` (NOTIF-004), `TD-60` (notification icon design), `TD-61` (stuck-queue alert), `TD-62` (Web Push parity). If `TD-53` is closed in same PR, mark resolved. |
| `docs/SSOT/DECISIONS.md` | Add `EXEC-10` summarizing D-N1..D-N4 + outbox+webhook architecture choice |

---

## 13. Open items requiring PM input

These are not blockers for writing the implementation plan, but worth flagging:

1. **EAS account:** confirm permission to run `eas init` and create a free EAS project under the existing Expo org.
2. **iOS Notification Service Extension:** out of scope, but blocks rich media (images) in push. Worth a TD if product wants previews of post images in push.
3. **Follow-request quick actions (Approve/Reject from notification):** AC2 says "where supported." If PM wants this in MVP, flag now — adds ~100 LOC of `UNNotificationCategory` + server-side action endpoint. Otherwise we defer.

---

## 14. Change log

| Version | Date | Summary |
|---|---|---|
| 0.1 | 2026-05-13 | Initial draft after PM brainstorming session — all six design sections approved. |
