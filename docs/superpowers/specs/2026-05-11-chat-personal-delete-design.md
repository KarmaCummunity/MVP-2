# Chat — Personal delete / hide from inbox

> Date: 2026-05-11 · Status: **Shipped** (code + migration + SSOT 2026-05-12) · SRS: `FR-CHAT-016`; amendments to `FR-CHAT-004`, `FR-CHAT-006`, `FR-CHAT-001`, `FR-CHAT-012`

## 1 — Problem and goal

Users want to **remove a conversation from their own inbox** regardless of post anchor status, closure, read state, etc. This must **not** delete history for the counterpart or change their inbox. It is **not** account deletion (`FR-CHAT-013`) and **not** moderation removal (`removed_at`).

**Out of scope for this feature:** Super Admin support thread — **no** personal delete (`FR-CHAT-007` unchanged).

## 2 — Product decisions (brainstorming)

| Topic | Decision |
| --- | --- |
| Semantics | **Personal hide** only; counterpart unchanged. |
| Re-open via entry point | After hide, opening chat again with the **same user** (profile / post CTA) creates a **new** `Chat` row; my side starts empty; old row stays in DB for the other party and analytics. |
| Support thread | **Excluded** — no delete action; always reuse existing support thread per `FR-CHAT-007`. |
| UI entry points | **Both** inbox row action and conversation header `⋮` menu (same copy and flow). |
| Confirmation | **Modal** — short explanation + Cancel + destructive confirm. |
| Counterpart messages old thread | If I hid a thread and the **counterpart sends** on that **same** `chat_id` before I start a new fork, the **old thread reappears** in my inbox (hide is cleared for that row). |

## 3 — Conflict with current schema and SRS

### 3.1 Database

`public.chats` has `unique (participant_a, participant_b)` (`0004_init_chat_messaging.sql`). That **forbids** multiple non-support threads for the same ordered pair.

**Resolution:**

1. **Drop** the global unique constraint on `(participant_a, participant_b)`.
2. **Add** a **partial** unique index so support remains singleton:

   `create unique index chats_unique_support_pair on public.chats (participant_a, participant_b) where is_support_thread = true;`

3. Update `rpc_get_or_create_support_thread` (`0011_chat_helpers.sql`) to select `where participant_a = v_a and participant_b = v_b and is_support_thread = true` (defensive once non-support duplicates exist).

### 3.2 SRS

- **`FR-CHAT-004` / `FR-CHAT-006`:** Today, one chat per unordered user pair for normal DMs. **Amend:** After a user performs personal hide and opens a new DM with the same counterpart, **a second `Chat` row is allowed**. Anchor rules apply **per `chat_id`** (first anchor on that row; reuse RPCs scoped to the active row).
- **`FR-CHAT-001`:** Inbox lists chats subject to filters below; **at most one visible row per human counterpart** (dedupe by other participant `user_id`, pick the chat with greatest `last_message_at` among rows visible to me).
- **`FR-CHAT-012`:** Unread badge counts only messages in chats that are **not** inbox-hidden for the viewer.

## 4 — Data model

Add two nullable columns on `public.chats` (names illustrative; pick one naming style in migration):

- `inbox_hidden_at_a timestamptz` — set when participant `participant_a` confirms personal delete; cleared when policy in §5.2 fires.
- `inbox_hidden_at_b timestamptz` — symmetric for `participant_b`.

**Alternative** considered: separate `chat_participant_state` table — rejected for MVP footprint unless multiple per-user flags accumulate.

**Do not** overload `removed_at` — that is moderation (`0005_init_moderation.sql`).

## 5 — Behaviour details

### 5.1 Hide (confirm in modal)

- Client calls authenticated RPC or `update` allowed by RLS: set my side’s `inbox_hidden_at_* = now()` for the target `chat_id`.
- **Support thread:** server rejects (`is_support_thread = true` and caller is not Super Admin) or UI never offers the action.

### 5.2 Unhide (clear flags)

- **On insert of a new `messages` row** for `chat_id`: set **both** `inbox_hidden_at_a` and `inbox_hidden_at_b` to `NULL` for that chat.

  Rationale: counterpart message revives the row for me (AC); if I send first after hiding, my inbox should also show the thread again without orphaning UX.

### 5.3 `findOrCreate` / open flows

- **`findOrCreateChat` today** uses `.maybeSingle()` on `(participant_a, participant_b)` — **invalid** once duplicates exist.

**Replace with:**

1. **Default “resume” path** (no explicit “new chat after hide”): select among matching pairs `is_support_thread = false` where my `inbox_hidden_at` is null, order by `last_message_at desc`, limit 1. If found, apply existing re-anchor logic and return.
2. **“Fresh thread” path** (user hid and opens from profile/post CTA): caller passes `preferNewConversation: true` (or dedicated use case). **Always** `insert` a new `chats` row (same canonical `participant_a` / `participant_b`, `is_support_thread = false`). Anchor from CTA as today.

**Edge case:** I have a new empty fork and the counterpart messages the **old** fork — old unhides and likely wins **deduped inbox** by `last_message_at`. The empty fork may remain an orphan with no messages; **optional** later cleanup (TECH_DEBT) — not required for MVP if dedupe hides it from inbox (zero messages → `last_message_at` may still be `created_at`; if tie, prefer non-empty last message — implementation note in plan).

### 5.4 Inbox query (`getMyChats`)

1. Fetch candidate chats for `userId` (existing `or` on participants).
2. Drop rows where my side’s `inbox_hidden_at_*` is not null.
3. **Dedupe** by counterpart `user_id`: keep one chat per other participant with max `last_message_at`.
4. Continue existing preview + unread aggregation on the **deduped** set.

### 5.5 Unread total (`rpc_chat_unread_total`)

Add join predicate: exclude chats where viewer’s `inbox_hidden_at_*` is not null (mirror inbox).

### 5.6 RLS / visibility

- **Do not** treat personal hide as full denial of `SELECT` on `messages` for that `chat_id` if the user deep-links with a valid `chat_id` (notifications, rare). MVP simplification: **either** allow read when participant **or** keep strict filter — pick in implementation plan; default recommendation: **still readable** when opening thread screen by id so push tap does not show empty thread; inbox filter remains source of “gone from list”.

## 6 — Layering

| Layer | Responsibility |
| --- | --- |
| **Supabase** | Migration (columns, partial unique, trigger `messages` AFTER INSERT to clear hide flags); RPC `rpc_chat_hide_for_viewer(p_chat_id uuid)` (security definer or invoker per existing patterns); update `rpc_chat_unread_total`; fix support RPC select. |
| **Application** | `HideChatForMeUseCase`; extend `findOrCreate` port with `options: { preferNewThread?: boolean }`; inbox use case documents dedupe. |
| **Mobile** | Confirmation modal (Hebrew copy in `he.ts`); inbox swipe/menu + `⋮` item; pass `preferNewThread` when navigating after a successful hide for that counterpart (session flag or navigation param). |

## 7 — i18n (Hebrew)

- Modal title + body: explain that the thread disappears **only for me**, that the other person keeps history, and that a **new message in this thread** can bring it back.
- Confirm button: destructive styling; Cancel default.

## 8 — Testing

- **Domain/application:** hide clears from list predicate; dedupe picks latest `last_message_at`.
- **Integration:** two users, hide on A, B sends → A sees thread again; unread count obeys hide.
- **DB:** partial unique still enforces single support thread; two normal rows same pair insert succeeds.

## 9 — Risks

- **Realtime / multi-device:** hide must sync via postgres update (other device drops row from list on next fetch or subscription).
- **Closure triggers** (`0026`, `0021`): fan-out assumes `chat_id` list — unaffected.
- **Backfill:** `NULL` hide columns = today’s behaviour.

## 10 — SSOT follow-up (same PR as code)

- Update `docs/SSOT/spec/07_chat.md` with `FR-CHAT-016` and deltas to `FR-CHAT-001`, `FR-CHAT-004`, `FR-CHAT-006`, `FR-CHAT-012`.
- `BACKLOG.md` / `PROJECT_STATUS.md` per workspace rules.

## 11 — Version history

| Version | Date | Summary |
| --- | --- | --- |
| 0.1 | 2026-05-11 | Initial design from approved brainstorming. |
| 0.4 | 2026-05-12 | Marked **Shipped** — architecture file splits completed (`pnpm lint:arch` green). |
