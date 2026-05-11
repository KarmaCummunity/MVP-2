# Chat personal inbox hide (FR-CHAT-016) — Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans or subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Let users hide a DM from their own inbox (not for counterpart), with confirmation; support thread excluded; new DM row after hide + re-entry; old thread reappears if any message lands on that `chat_id`; inbox deduped one row per counterpart; unread badge excludes hidden.

**Architecture:** DB columns `inbox_hidden_at_a` / `inbox_hidden_at_b`, drop global unique pair, partial unique for `is_support_thread`, trigger on `messages` INSERT clears both hide timestamps, `SECURITY DEFINER` RPC `rpc_chat_hide_for_viewer`, updated `rpc_chat_unread_total` + support RPC SELECT; app repo filters + dedupes list, `findOrCreateChat` with `preferNewThread`, use case + navigation pref; mobile modal + inbox row action + chat menu.

**Tech Stack:** Postgres/Supabase, TypeScript, Expo RN, vitest.

**Spec:** [`docs/superpowers/specs/2026-05-11-chat-personal-delete-design.md`](../specs/2026-05-11-chat-personal-delete-design.md)

---

## Tasks (execution order)

- [x] **T1:** Add migration `supabase/migrations/0033_chat_inbox_personal_hide.sql` (columns, drop unique, partial index, trigger, RPCs, grant).
- [x] **T2:** Patch `app/packages/infrastructure-supabase/src/database.types.ts` (`chats` columns + `rpc_chat_hide_for_viewer`).
- [x] **T3:** `getMyChats.ts` — filter hidden for viewer + dedupe by counterpart + sort.
- [x] **T4:** `SupabaseChatRepository.ts` + `supabaseDmChat.ts` — `findOrCreateChat` options + `hideChatFromInbox`; multi-row select (no `.maybeSingle` on pair).
- [x] **T5:** `IChatRepository.ts`, `OpenOrCreateChatUseCase`, `fakeChatRepository`, tests.
- [x] **T6:** `HideChatFromInboxUseCase` + `container.ts` wiring.
- [x] **T7:** `chatNavigationPrefs.ts` + wire `contactPoster.ts` + `app/user/[handle]/index.tsx` for `preferNewThread`.
- [x] **T8:** Mobile: `he.ts` / `partials/chatHe.ts`, confirm modal, `ChatActionMenu`, `[id].tsx`, `index.tsx` inbox action + `chatStore.refreshInbox`.
- [x] **T9:** `docs/SSOT/spec/07_chat.md` + `BACKLOG.md` (+ `TECH_DEBT.md`); `PROJECT_STATUS.md` not present in repo.
- [x] **T10:** `cd app && pnpm typecheck && pnpm test && pnpm lint` — green 2026-05-12; architecture splits (`chatStoreTypes`, overlays, styles, `supabaseDmChat`) complete.

---

## Self-review (plan vs spec)

| Spec section | Task |
| --- | --- |
| Personal hide, modal, both surfaces | T8 |
| Support excluded | T1 RPC + T8 UI |
| New row after re-entry | T4 + T7 |
| Message revives thread | T1 trigger |
| Inbox dedupe | T3 |
| Unread excludes hidden | T1 + T3 |
| SRS docs | T9 |

No TBD placeholders.
