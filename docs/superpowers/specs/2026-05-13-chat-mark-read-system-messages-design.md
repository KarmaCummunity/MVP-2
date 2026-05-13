# Chat — Mark-Read Must Cover System Messages

**Date:** 2026-05-13
**Mapped to spec:** FR-CHAT-011 (Read receipts), FR-CHAT-012 (Unread badge)
**Status:** ⏳ Planned

## Problem

After opening a chat and exiting it, the top-bar badge and the inbox-row badge re-appear within ~200ms without any new message arriving. The user has to repeatedly re-open the chat; the badge never settles at zero.

## Root cause

`rpc_chat_mark_read` and `rpc_chat_unread_total` are **asymmetric** with respect to system messages (rows with `sender_id IS NULL`, `kind = 'system'`):

| RPC | Filter | Treatment of `sender_id IS NULL` |
|---|---|---|
| `rpc_chat_mark_read` (migration 0011) | `sender_id <> auth.uid()` | SQL three-valued logic: `NULL <> X` → `NULL` → row excluded. System messages **never** get `status='read'`. |
| `rpc_chat_unread_total` (migration 0033) | `sender_id IS DISTINCT FROM auth.uid()` | `NULL IS DISTINCT FROM X` → `TRUE` → row included. System messages **do** count as unread. |

A second compounding factor: the column-level RLS policy `messages_update_status_recipient` restricts UPDATE to `kind = 'user' AND sender_id IS NOT NULL`. Even if the RPC's WHERE clause matched system messages, the policy would block the UPDATE because the RPC runs `SECURITY INVOKER`.

System messages reach a user's inbox from several triggers, all inserting with `sender_id = NULL`, `kind = 'system'`, `status = 'delivered'`:
- `reports_emit_admin_system_message` (migration 0013 → 0033 → 0047) — new report appears in super-admin support thread.
- `posts_after_update_emit_closure_messages` (migration 0026/0031) — "post closed" notice in DM threads anchored to the post.
- Admin ban / delete moderation notices (migration 0037).
- Donation-link reports (migration 0048).

### Bug timeline

1. Trigger inserts a system message → realtime INSERT → `bumpInboxForIncomingInsert` adds +1 to chat row + total. Topbar shows 1. ✅
2. User opens the chat → `useChatInit` calls `markChatRead.execute()` + `markChatLocallyRead` → local store zeroed.
3. Server `rpc_chat_mark_read` runs — matches **0 rows** for the system message.
4. Realtime UPDATE messages event (from the user-message rows that did flip to `read`) triggers `fireUnreadDebounced`. After 200ms, `rpc_chat_unread_total` runs and still returns **N>0** (system messages remain `delivered`).
5. `inboxSnapshotEpoch` guard does not fire (no local mutation during the RPC), so the result is accepted. `unreadTotal` is reset to N. Badge re-appears.

## Why the existing `inboxSnapshotEpoch` guard does not help

`inboxSnapshotEpoch` (PR #88 era) detects local state changes during an in-flight unread-total RPC and drops stale results. But here the server's response is *not* stale — it accurately reflects the server's count. The asymmetry is in the data itself, not in the timing.

## Approaches considered

**A — Fix mark-read to cover system messages. (Chosen.)**
Change `rpc_chat_mark_read` to `SECURITY DEFINER`, use `IS DISTINCT FROM` instead of `<>`, and guard with an explicit participant check inside the function. One-time cleanup updates pre-fix system messages that have been stuck at `delivered`.

- Pro: preserves the product signal (admin sees badge for new reports; users see badge for post-closure system messages).
- Pro: minimal blast radius — single SQL function + a no-op-once cleanup statement.
- Pro: keeps the inbox math (`getMyChats` unread count, `rpc_chat_unread_total`, `bumpInboxForIncomingInsert`) consistent — all three count system messages as unread, and now all three see them clear together.

**B — Filter system messages out of the unread count entirely.**
Change `rpc_chat_unread_total` and `getMyChats.unreadByChat` to require `kind = 'user'`.

- Con: admin loses the "new report waiting" signal.
- Con: user loses the "post-closed" signal.
- Rejected.

**C — Per-user `last_read_at` on chat row.**
Track read state via a timestamp instead of per-message status.

- Con: schema change, RLS changes, realtime topic changes, broad test surface.
- Con: out of scope for a localized regression.
- Rejected.

## Acceptance criteria

- AC1. Opening a chat that contains a system message clears the inbox-row badge **and** the topbar badge, and they stay at 0 until a new message arrives.
- AC2. After the migration applies, any pre-existing system message with `status <> 'read'` whose chat has no remaining user-message unreads is marked `read`. (Conservative scope: only chats where every non-system message is already read — i.e., the user has already engaged. See "Cleanup heuristic" below.)
- AC3. The unread badge still appears when a *new* system message arrives (admin gets a badge on new reports; users get a badge on post-closure).
- AC4. `rpc_chat_mark_read` continues to refuse non-participants (`auth.uid()` must be one of the chat's participants).
- AC5. Repeated calls to `rpc_chat_mark_read` are idempotent (no-op when already read).

## Cleanup heuristic

Marking *all* pre-existing system messages as read would be wrong — it would clear genuinely unread system messages that the user has not yet engaged with.

Safer approach: only clear system messages in chats where the user has already read every user-sent message (i.e., the asymmetry is the only reason the chat still shows as unread). Concretely:

```sql
update public.messages target
   set status = 'read'
  from public.chats c
 where target.chat_id = c.chat_id
   and target.kind = 'system'
   and target.status <> 'read'
   and not exists (
     select 1 from public.messages m2
      where m2.chat_id = c.chat_id
        and m2.kind = 'user'
        and m2.status <> 'read'
   );
```

This leaves chats with active user-message unreads alone. The next time the user opens those chats, the fixed RPC handles them.

## Out of scope

- No changes to `IChatRepository`, `IChatRealtime`, application use cases, mobile store, or React UI. The bug is purely server-side and the client already issues the correct call.
- No change to the `messages_on_status_change` transition trigger — `delivered → read` is already permitted for any `kind`.
- No change to RLS policies. The `SECURITY DEFINER` upgrade is the minimum needed; broadening the column-level UPDATE policy to system messages would also work but is broader than necessary.

## Test plan

`supabase/tests/0054_chat_mark_read_includes_system.sql` (pgTAP-style, following the convention used by `0048_donation_link_report_message.sql`):

- T1: a chat with one user message + one system message, both `delivered`. Caller is the recipient. After `rpc_chat_mark_read`, both rows are `status='read'`.
- T2: `rpc_chat_unread_total` returns 0 immediately after T1 (closes the original race).
- T3: a non-participant calling `rpc_chat_mark_read` is rejected (`forbidden`).
- T4: idempotency — second call after T1 is a no-op (no error, no row affected).
- T5: cleanup heuristic — a chat with an old system message and a user message that is already `read` gets the system message flipped by the one-time cleanup; a chat with a user message still `delivered` does NOT have its system message touched.

## Risk and rollback

- Risk: low. Single SQL function + a single conditional update. No schema change, no policy change.
- Rollback: revert the migration. The function reverts to the old `<>` form; the cleanup is forward-only but harmless if re-run (no-op).
