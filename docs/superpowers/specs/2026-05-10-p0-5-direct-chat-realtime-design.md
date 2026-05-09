# P0.5 — Direct Chat with Realtime — Design

| Field | Value |
| ----- | ----- |
| **Status** | Approved (brainstorming complete) — pending implementation plan |
| **Date** | 2026-05-10 |
| **Mapped SRS** | FR-CHAT-001..013 (full scope, with deferrals listed in §11) |
| **Related** | FR-MOD-001 (P1.3 — defers full report flow), FR-NOTIF-001 (P1.5 — defers push), FR-PROFILE (P2.4 — partial profile screen here closes TD-40 in part) |
| **Lane** | Solo, sequential — single agent, multiple PRs |
| **Scope band** | D — full FR-CHAT scope including profile entry (006), support thread (007), block effects (009), reporting (010), deletion placeholder (013) |

---

## 1. Why this exists

P0.5 is the next P0 feature on the critical path. It unblocks the **PMF loop**: a poster and a requester must be able to coordinate delivery in-app, otherwise nothing closes. P0.6 (closure / `closed_delivered`) depends on chat existing.

The DB layer (migration `0004_init_chat_messaging`) already provisions chats, messages, RLS, the realtime publication, status triggers, support-thread auto-flag, `has_blocked()`, and `is_chat_visible_to()`. P0.5 is therefore **predominantly a contract + adapter + FE replacement task** — not a backend redesign.

---

## 2. Scope

### In scope (this spec)

| FR | Coverage |
| -- | -------- |
| FR-CHAT-001 | Inbox list, sort by `last_message_at desc`, search by name (client-side prefix), pagination 30/page |
| FR-CHAT-002 | Conversation screen, RTL bubbles, composer with 2000-char cap and counter, timestamp on tap, `⋮` menu |
| FR-CHAT-003 | Send message — optimistic, `pending → delivered → read`, retry on network error. **AC4 (push notification) deferred to P1.5** |
| FR-CHAT-004 | Anchor to post; first-anchor-wins (deduplicates); banner when anchored post deleted |
| FR-CHAT-005 | Auto-message template; editable; idempotent (re-entry from same post navigates without re-prefilling) |
| FR-CHAT-006 | Open chat from `/user/[handle]`; closes part of TD-40 (`IUserRepository.findByHandle`) |
| FR-CHAT-007 | Support thread via Settings → "דווח על תקלה". **AC3 system-message-with-report-summary deferred to P1.3** (see TD-117) |
| FR-CHAT-008 | Restricted entry-points policy: post-detail / profile / settings-issue / Donations · Time (TD-114 wires the 4th entry point in a follow-up PR) |
| FR-CHAT-009 | Block / unblock — minimal UX (block from `⋮`); inbox auto-filter; DB carve-out already enforces FR-CHAT-009 AC1 server-side |
| FR-CHAT-010 | Report from `⋮` opens a Report modal with `target_type='chat'`; INSERT to `reports` table; admin-side processing deferred to P1.3 (TD-116) |
| FR-CHAT-011 | Read receipts — bulk-read on thread open; server-side via RLS UPDATE policy on `messages.status` |
| FR-CHAT-012 | Unread badge in top bar; `9+` cap |
| FR-CHAT-013 | Counterpart deletion placeholder — "משתמש שנמחק" + generic avatar; composer disabled |

### Out of scope (deferred to later milestones)

- Push notifications (FR-CHAT-003 AC4) → **P1.5 / TD-115**
- Full report processing pipeline (auto-removal, dedup toast, false-report sanctions) → **P1.3 / TD-116**
- System-message-with-report-summary in the support thread (FR-CHAT-007 AC3 / FR-MOD-002) → **P1.3 / TD-117**
- Donations · Time → support thread handoff (TD-114) → **separate post-P0.5 PR**, mechanically trivial once `OpenOrCreateChatUseCase` exists
- Pinning, archive view, 90-day deleted-thread auto-archive (FR-CHAT-013 AC3) → **post-MVP**
- Block management UI in Settings (list + bulk unblock) → **P1.4**

---

## 3. Architecture decision: separate Realtime port

We split the chat I/O surface into two ports rather than mixing one-shot CRUD with subscriptions:

- `IChatRepository` — pure one-shot operations: queries, inserts, updates. Pure `(input) → Promise<output>` shape consistent with `IPostRepository` / `IAuthService`.
- `IChatRealtime` — subscriptions only. Returns `Unsubscribe` handles. Callback-based callbacks typed per stream kind.

**Reasoning.** A single mixed port would entangle two paradigms (idempotent fetch vs stateful long-lived subscription) in one interface, making mocks and tests harder to reason about. Two ports map naturally to two adapters (`SupabaseChatRepository`, `SupabaseChatRealtime`); replacing the realtime engine later means swapping one adapter, not migrating callsites.

**Realtime is not exposed via use cases.** `subscribeToInbox` / `subscribeToChat` are *managed side-effects*, not orchestrations of business logic. They are consumed directly from `chatStore` (Zustand), which owns subscription lifecycle. Use cases stay pure.

---

## 4. Domain entities (additions to `@kc/domain/src/entities.ts`)

```ts
export type MessageStatus = 'pending' | 'delivered' | 'read';
export type MessageKind = 'user' | 'system';

export interface Message {
  messageId: string;
  chatId: string;
  senderId: string | null;            // null after sender hard-delete (FR-CHAT-013)
  kind: MessageKind;
  body: string | null;                // user: required; system: optional
  systemPayload: Record<string, unknown> | null;
  status: MessageStatus;
  createdAt: string;                  // ISO
  deliveredAt: string | null;
  readAt: string | null;
}

export interface Chat {
  chatId: string;
  participantA: string;               // canonical-ordered (a < b) per migration 0004
  participantB: string;
  anchorPostId: string | null;
  isSupportThread: boolean;
  lastMessageAt: string;
  createdAt: string;
}

export interface Block {
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export type ReportTargetType = 'post' | 'user' | 'chat' | 'none';
export type ReportReason = 'Spam' | 'Offensive' | 'Misleading' | 'Illegal' | 'Other';

export interface ReportSubmission {
  targetType: ReportTargetType;
  targetId: string | null;             // null iff targetType === 'none'
  reason: ReportReason;
  note?: string;                       // ≤500 chars (DB CHECK)
}
```

Invariants (`@kc/domain/src/invariants.ts`): `MESSAGE_MAX_LENGTH = 2000`, `REPORT_NOTE_MAX_LENGTH = 500`.

**`Chat.unreadCount` does not live on the entity.** It is a per-viewer derived value. It lives on the existing `ChatWithPreview` view-model in `@kc/application`, not in `@kc/domain`.

**No `MessageStatus = 'sending'` shadow state.** The DB has three statuses; we mirror them 1:1. The optimistic-pending state on the FE is represented in `chatStore` via an `OptimisticMessage extends Message` row carrying a transient `clientId` field — it is not a domain concept.

---

## 5. Errors (additions to `@kc/domain/src/errors.ts`)

```ts
export type ChatErrorCode =
  | 'message_body_required'
  | 'message_too_long'
  | 'chat_not_found'
  | 'chat_forbidden'           // RLS denial — viewer is blocker-side or not participant
  | 'send_to_deleted_user'     // FK violation on sender_id (counterpart deleted)
  | 'super_admin_not_found'    // RPC error from rpc_get_or_create_support_thread
  | 'unknown';

export type BlockErrorCode = 'self_block_forbidden' | 'unknown';

export type ReportErrorCode =
  | 'invalid_target'
  | 'duplicate_within_24h'      // FR-MOD-001 AC7 — surfaced from DB-level dedup
  | 'unknown';
```

Each error class follows the `PostError` pattern: `class ChatError extends Error { constructor(public code: ChatErrorCode, message?: string) { super(message ?? code); } }`.

---

## 6. Ports

### `@kc/application/src/ports/IChatRepository.ts` (extended)

```ts
export interface ChatWithPreview extends Chat {
  otherParticipant: {
    userId: string | null;            // null when counterpart hard-deleted
    displayName: string;
    avatarUrl: string | null;
    isDeleted: boolean;
  };
  lastMessage: Message | null;
  unreadCount: number;
}

export interface IChatRepository {
  // Conversations
  getMyChats(userId: string): Promise<ChatWithPreview[]>;
  findOrCreateChat(userId: string, otherUserId: string, anchorPostId?: string): Promise<Chat>;
  findById(chatId: string): Promise<Chat | null>;

  // Messages
  getMessages(chatId: string, limit: number, beforeCreatedAt?: string): Promise<Message[]>;
  sendMessage(chatId: string, senderId: string, body: string): Promise<Message>;
  markRead(chatId: string, userId: string): Promise<void>;

  // Counters / metadata
  getUnreadTotal(userId: string): Promise<number>;
  getCounterpart(chat: Chat, viewerId: string): Promise<{
    userId: string | null;
    displayName: string;
    avatarUrl: string | null;
    isDeleted: boolean;
  }>;

  // Support thread
  getOrCreateSupportThread(userId: string): Promise<Chat>;
}
```

**Change vs current:** drops the existing `superAdminId` argument from `getOrCreateSupportThread` — the adapter resolves the super admin via the canonical email lookup inside `rpc_get_or_create_support_thread`. Adds `getUnreadTotal` and `getCounterpart`.

### `@kc/application/src/ports/IChatRealtime.ts` (new)

```ts
export interface InboxStreamCallbacks {
  onChatChanged: (chat: Chat) => void;
  onUnreadTotalChanged: (total: number) => void;
}
export interface ChatStreamCallbacks {
  onMessage: (m: Message) => void;
  onMessageStatusChanged: (m: Pick<Message, 'messageId' | 'status' | 'deliveredAt' | 'readAt'>) => void;
  onError: (err: Error) => void;
}
export type Unsubscribe = () => void;

export interface IChatRealtime {
  subscribeToInbox(userId: string, cb: InboxStreamCallbacks): Unsubscribe;
  subscribeToChat(chatId: string, cb: ChatStreamCallbacks): Unsubscribe;
}
```

### `@kc/application/src/ports/IBlockRepository.ts` (new, minimal)

```ts
export interface IBlockRepository {
  block(blockerId: string, blockedId: string): Promise<void>;
  unblock(blockerId: string, blockedId: string): Promise<void>;
  isBlockedByMe(viewerId: string, otherId: string): Promise<boolean>;
}
```

### `@kc/application/src/ports/IReportRepository.ts` (new, stub)

```ts
export interface IReportRepository {
  submit(reporterId: string, input: ReportSubmission): Promise<void>;
}
```

### `@kc/application/src/ports/IUserRepository.ts` (extended)

Adds:
```ts
findByHandle(handle: string): Promise<User | null>;
```
Closes the part of TD-40 required by FR-CHAT-006.

---

## 7. Use cases

All under `@kc/application/src/`. Each file ≤200 lines, single class with `execute`.

### `chat/`

- **`ListChatsUseCase`** — input `{ userId }`. Calls `repo.getMyChats`. Sorts by `lastMessageAt desc` (sanity).
- **`OpenOrCreateChatUseCase`** — input `{ viewerId, otherUserId, anchorPostId? }`. Delegates to `repo.findOrCreateChat`. The DB enforces first-anchor-wins via the `unique (participant_a, participant_b)` constraint plus `ON CONFLICT DO NOTHING` semantics in the adapter; we return the existing row's `anchor_post_id` regardless of the input. *Used by all three creating entry-points (post detail, profile, support-thread fallback).*
- **`SendMessageUseCase`** — input `{ chatId, senderId, body }`. Validation: `body.trim().length` ∈ [1, `MESSAGE_MAX_LENGTH`]; throws `ChatError('message_body_required' | 'message_too_long')`. Delegates to `repo.sendMessage`.
- **`MarkChatReadUseCase`** — input `{ chatId, userId }`. Wraps `repo.markRead`.
- **`GetUnreadTotalUseCase`** — input `{ userId }`. Wraps `repo.getUnreadTotal`. Used by the top-bar badge during refresh / sign-in.
- **`GetSupportThreadUseCase`** — input `{ userId }`. Wraps `repo.getOrCreateSupportThread`. May throw `ChatError('super_admin_not_found')`.
- **`BuildAutoMessageUseCase`** — pure function-class. Input `{ postTitle: string }`. Returns `string` per FR-CHAT-005 AC1 template (`"היי! ראיתי את הפוסט שלך על {title}. אשמח לדעת עוד."`). No port dependency — fully unit-testable.

### `block/`

- **`BlockUserUseCase`** — input `{ blockerId, blockedId }`. Validation: `blockerId !== blockedId` → `BlockError('self_block_forbidden')`. Delegates to `repo.block`.
- **`UnblockUserUseCase`** — input `{ blockerId, blockedId }`. Wraps `repo.unblock`.

### `reports/`

- **`ReportChatUseCase`** — input `{ reporterId, chatId, reason, note? }`. Builds a `ReportSubmission` with `targetType: 'chat'` and delegates to `repo.submit`. Surfaces `ReportError('duplicate_within_24h')` from adapter.

---

## 8. FE architecture

### `chatStore` — `apps/mobile/src/store/chatStore.ts`

Zustand store. Owns subscription lifecycle. Reducers are thin — no business logic.

```ts
interface OptimisticMessage extends Message {
  clientId: string;            // local UUID, present until server-ack
  failed?: boolean;
}

interface ChatState {
  inbox: ChatWithPreview[] | null;
  unreadTotal: number;
  threads: Record<string, OptimisticMessage[]>;     // asc by createdAt
  inboxSub: Unsubscribe | null;
  threadSubs: Record<string, Unsubscribe>;

  setInbox(chats: ChatWithPreview[]): void;
  upsertChatPreview(chat: Chat): void;
  setUnreadTotal(n: number): void;
  setThreadMessages(chatId: string, msgs: Message[]): void;
  appendOptimistic(chatId: string, msg: OptimisticMessage): void;
  reconcileSent(chatId: string, clientId: string, server: Message): void;
  markFailed(chatId: string, clientId: string): void;
  applyIncomingMessage(chatId: string, msg: Message): void;
  applyStatusChange(chatId: string, patch: Pick<Message, 'messageId' | 'status' | 'deliveredAt' | 'readAt'>): void;
  startInboxSub(userId: string, realtime: IChatRealtime): void;
  startThreadSub(chatId: string, realtime: IChatRealtime): void;
  stopThreadSub(chatId: string): void;
  resetOnSignOut(): void;
}
```

**Lifecycle.** `startInboxSub` is called once per logged-in session from `AuthGate`'s post-auth effect. It populates `inbox` (via `ListChatsUseCase`), seeds `unreadTotal` (via `GetUnreadTotalUseCase`), and opens the realtime subscription. `resetOnSignOut` is wired to `useAuthStore.signOut`.

`startThreadSub` is called from the conversation screen on mount; `stopThreadSub` on unmount.

### Screens

**Replaced (consume real ports):**

- **`app/chat/index.tsx` (Inbox).** Replace `MOCK_CHATS` with `chatStore.inbox`. Add: top-bar `TextInput` for client-side prefix search; infinite scroll using cursor on last `lastMessageAt`; preserve existing `<EmptyState>`.
- **`app/chat/[id].tsx` (Thread).** Replace `MOCK_MESSAGES` with `chatStore.threads[chatId]`. Additions:
  - Header: counterpart name + avatar; `⋮` menu with `View profile`, `Block`, `Report`. Disabled when `chat.isSupportThread` (no block/report on admin).
  - RTL bubbles (mine → `flex-start`, counterpart → `flex-end`); timestamp shown on tap.
  - Composer: char counter visible at >1900; send disabled at 0 or >2000.
  - Retry icon on `failed` bubble.
  - Banner when `chat.anchorPostId !== null` and the post is missing → "הפוסט המקורי לא זמין יותר" (FR-CHAT-004 edge case).
  - When counterpart `isDeleted` → header "משתמש שנמחק" + generic avatar. **Composer remains enabled** per FR-CHAT-013 AC2 — outgoing messages persist server-side but are never delivered (no recipient). The bubble shows status `pending` indefinitely; no retry icon (this is not a network error).
  - On mount: `MarkChatReadUseCase` (bulk read, FR-CHAT-011 AC2).
  - On incoming `onMessage` while focused: bulk-read again immediately.

**New:**

- **`app/user/[handle].tsx`** — minimal other-user profile. Avatar + display name + handle + bio (if available) + `שלח הודעה` CTA → `OpenOrCreateChatUseCase` → `router.push('/chat/{id}')`. `⋮` includes `Block`. Closes the FR-CHAT-006 reachability gap; closes part of TD-40.
- **`app/settings/report-issue.tsx`** — single button: "פתח שיחת תמיכה" → `GetSupportThreadUseCase` → `router.push('/chat/{id}')`. The Settings entry-point on `app/(tabs)/profile.tsx` (or equivalent settings hub) gains a row "דווח על תקלה" routing here.

**Top-bar badge (FR-CHAT-012).** Add `<ChatBadge />` consumed in the top tab header (Home tab). Reads `useChatStore(s => s.unreadTotal)`; renders `count` capped visually at `'9+'`.

### Auto-message wiring (FR-CHAT-005)

In `app/post/[id].tsx`, the `שלח הודעה` CTA flow:

1. `OpenOrCreateChatUseCase({ viewerId, otherUserId: post.authorId, anchorPostId: post.id })` → `chat`.
2. **Idempotence check (AC4):** call `getMessages(chat.chatId, 50)` and look for any `senderId === viewerId` whose body equals the template for this `post.title`. If found → navigate without prefill. If not → navigate with `prefill` query param.
3. Thread screen reads `useLocalSearchParams().prefill` once on mount and injects it into the composer (editable). Sending unchanged is allowed.

### Optimistic flow (FR-CHAT-003 AC1)

```
user taps send
  → generate clientId (uuid)
  → chatStore.appendOptimistic({ clientId, status: 'pending', body, createdAt: now() })
  → SendMessageUseCase.execute(...)
  → on ack: chatStore.reconcileSent(clientId → server.messageId, status: 'delivered')
  → on realtime onMessageStatusChanged: applyStatusChange (e.g. → 'read')
  → on network error: chatStore.markFailed(clientId)
       → bubble shows retry icon → user taps → re-runs SendMessageUseCase with same clientId (no new optimistic row)
```

---

## 9. Migrations

### `0010_seed_super_admin.sql`

Solves FR-CHAT-007 AC1 without requiring service-role bypass. Trigger marks `is_super_admin = true` whenever a `public.users` row is inserted whose corresponding `auth.users.email = 'karmacommunity2.0@gmail.com'`. Also backfills any existing row. Idempotent.

```sql
create or replace function public.users_auto_promote_super_admin()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if exists (
    select 1 from auth.users au
    where au.id = new.user_id and au.email = 'karmacommunity2.0@gmail.com'
  ) then
    new.is_super_admin := true;
  end if;
  return new;
end; $$;

drop trigger if exists users_before_insert_super_admin_flag on public.users;
create trigger users_before_insert_super_admin_flag
  before insert on public.users
  for each row execute function public.users_auto_promote_super_admin();

update public.users u
set is_super_admin = true
from auth.users au
where au.id = u.user_id
  and au.email = 'karmacommunity2.0@gmail.com'
  and u.is_super_admin = false;
```

### `0011_chat_helpers.sql`

Three RPCs to shorten roundtrips:

- **`rpc_chat_mark_read(p_chat_id uuid)`** — `SECURITY INVOKER`. Bulk update of `messages` where `chat_id = p_chat_id AND sender_id <> auth.uid() AND status <> 'read'` → `status = 'read'`. Single broadcast event for FR-CHAT-011 AC2.
- **`rpc_chat_unread_total()`** — `SECURITY INVOKER`. Returns `bigint`. `SELECT COUNT(*) FROM messages m JOIN chats c USING (chat_id) WHERE auth.uid() IN (c.participant_a, c.participant_b) AND m.sender_id <> auth.uid() AND m.status <> 'read' AND public.is_chat_visible_to(c.*, auth.uid())`. Visual `9+` cap is FE-side.
- **`rpc_get_or_create_support_thread()`** — `SECURITY DEFINER` (so the viewer can read the super-admin row through the lookup despite RLS). Resolves the super admin (`SELECT user_id FROM users WHERE is_super_admin = true LIMIT 1`); if none → `raise exception 'super_admin_not_found' using errcode = 'P0001'`. Otherwise canonicalizes participants and `INSERT … ON CONFLICT (participant_a, participant_b) DO NOTHING RETURNING *` (or selects the existing row).

After both migrations land: regenerate `database.types.ts`.

---

## 10. Adapters (`@kc/infrastructure-supabase/src/`)

### `chat/SupabaseChatRepository.ts`

Implements `IChatRepository`. Postgres-error → `ChatError` mapping:
- FK violation on `messages.sender_id` → `send_to_deleted_user`.
- RLS violation on `INSERT messages` → `chat_forbidden`.
- CHECK violation on `body` length → `message_too_long` (defensive — use case validates first).
- `super_admin_not_found` raised by RPC → same code surfaced.

`getMessages(chatId, limit, beforeCreatedAt?)` returns rows ordered `created_at DESC` (newest first), filtered by `created_at < beforeCreatedAt` when the cursor is provided. The store reverses to `ASC` for display. Initial load passes no cursor and gets the latest `limit` messages.

`getCounterpart(chat, viewerId)` resolves the non-viewer participant via a `users` LEFT JOIN. If the row is missing (hard-deleted), returns `{ userId: null, displayName: 'משתמש שנמחק', avatarUrl: null, isDeleted: true }`.

`getMyChats` uses a single SQL with a `LATERAL` join to fetch the latest message per chat plus an aggregate subquery for `unread_count` (count of `messages` in the chat where `sender_id <> viewer AND status <> 'read'`). One round-trip; rows are mapped to `ChatWithPreview` in TS.

### `chat/SupabaseChatRealtime.ts`

Implements `IChatRealtime` over Supabase Realtime channels.

- `subscribeToChat(chatId, cb)`:
  - `supabase.channel('chat:' + chatId)`
  - `.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'chat_id=eq.' + chatId }, ...)` → `cb.onMessage(rowToMessage(row))`
  - `.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: 'chat_id=eq.' + chatId }, ...)` → `cb.onMessageStatusChanged(...)`
  - `.subscribe()`. Returns `() => channel.unsubscribe()`.

- `subscribeToInbox(userId, cb)`:
  - One channel listening for `INSERT`/`UPDATE` on `messages` *without* a chat-id filter. **Supabase Realtime applies RLS server-side** — the client only receives events for rows the viewer can SELECT, i.e. messages in chats where `is_chat_visible_to(chat, viewer) = true`. This naturally filters out blocker-side and non-participant chats.
  - Also `UPDATE` on `chats` for `last_message_at` bumps — emits `onChatChanged`.
  - `onUnreadTotalChanged` is recomputed by calling `repo.getUnreadTotal(userId)` after each message event, **debounced to 200 ms** to absorb bursts.

Errors during channel lifecycle surface as `cb.onError(err)`. The store retries `startInboxSub` once after 2s on error (single retry, not a loop).

### `block/SupabaseBlockRepository.ts`

INSERT / DELETE on `public.blocks` with `(blocker_id, blocked_id)`. `isBlockedByMe` is a `select 1` existence check.

### `reports/SupabaseReportRepository.ts`

INSERT on `public.reports`. Maps `unique_violation` (24h dedup once a partial unique index is added) to `ReportError('duplicate_within_24h')`. **Note:** the migration `0005` documents 24h dedup as trigger-based; the trigger is a P1.3 task. Until that lands, duplicates will be allowed at the DB layer. The error code is reserved for forward compatibility; the FE should not assume blocking client-side.

### Composition root

`apps/mobile/src/lib/container.ts` (create if absent; otherwise extend):
- exports singleton instances of each adapter and use case
- screens import use cases from this module rather than instantiating

---

## 11. Open questions for the implementation plan

These are deliberately deferred from the design phase and resolved during plan-writing:

1. **PR breakdown.** Recommended 3 PRs: `(contract)` commit (domain + ports + use case skeletons), `BE` (migrations + adapters + types regen), `FE` (chatStore + screen replacements + new screens + composition root).
2. **`database.types.ts` regen** is gated on the migrations PR landing.
3. **`AuthGate` integration** for `chatStore.startInboxSub` — exact effect placement.
4. **24h dedup trigger on `reports`** — ship now (small) or wait for P1.3? Defer.

---

## 12. Testing

### Unit tests (Vitest, `@kc/application/src/**/__tests__/`)

- `SendMessageUseCase` — empty / whitespace-only / >2000 / valid body.
- `OpenOrCreateChatUseCase` — first-anchor-wins (port called once with the original anchor on second invocation).
- `BuildAutoMessageUseCase` — pure: assert template equality with title.
- `BlockUserUseCase` — self-block throws.

No adapter integration tests in P0.5 (consistent with feed/posts precedent). Realtime is verified end-to-end manually.

### Manual verification (per `feedback_verify_ui_before_claiming_done`)

- Two browser profiles (regular + incognito) → optimistic / delivered / read transitions; unread badge updates with second window closed; bulk-read on open.
- Block flow — A blocks B → A's inbox loses the thread; B sees it but messages stay `pending` from A's perspective forever.
- Auto-message — first entry from post prefills; second entry skips prefill.
- Support thread — sign up `karmacommunity2.0@gmail.com` once; sign up regular user; Settings → "דווח על תקלה" → opens `is_support_thread` chat.
- Counterpart deletion — Supabase Admin hard-deletes user B; user A sees "משתמש שנמחק" + disabled composer.

---

## 13. Status updates required (in the same change-set)

- `docs/SSOT/PROJECT_STATUS.md` §2: P0.5 → 🟡 In progress on PR open; 🟢 Done on merge.
- `docs/SSOT/PROJECT_STATUS.md` §3 Sprint Board: P0.5 = "In progress"; P1.7 (D-16) parked pending TD-114 follow-up.
- `docs/SSOT/PROJECT_STATUS.md` §1 Snapshot: completion %, "What works" updated to mention live chat + realtime.
- `docs/SSOT/HISTORY.md`: append entry on merge (compact bullet, SRS IDs, PRs, tests, TD deltas).
- `docs/SSOT/TECH_DEBT.md`:
  - Add **TD-115 (FE)** — push notifications wiring for chat (depends on FR-NOTIF / P1.5).
  - Add **TD-116 (BE)** — full report processing pipeline (auto-removal, 24h dedup trigger, false-report sanctions; FR-MOD-001/004/008).
  - Add **TD-117 (BE)** — system-message-with-report-summary on support thread (FR-CHAT-007 AC3 / FR-MOD-002).
  - Update **TD-40** — `findByHandle` closed; remaining: counters / following list / etc.
  - Note on **TD-114** — "P0.5 ready; awaiting separate PR to wire Donations · Time → support thread."
