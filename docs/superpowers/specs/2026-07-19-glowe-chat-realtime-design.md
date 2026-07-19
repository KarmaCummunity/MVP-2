# GloWe chat Realtime + thread UX (Phase C slice)

**Date:** 2026-07-19  
**Status:** Approved for implementation (PM 2026-07-19)  
**Approach:** 1 — extend GloWe module pattern (no build step, thin realtime adapter)  
**Maps to:** FR-CHAT-001, FR-CHAT-002, FR-CHAT-003; FR-GLOWE-014 / FR-GLOWE-016 AC6 (messaging surface)  
**Decision:** D-182 (to be recorded in `DECISIONS.md` at implementation time)  
**Deferred:** follow system (separate brainstorm); read receipts, anchor cards, inbox hide, search, pagination, block/report from chat, FR-RESP-004 two-pane desktop

## Problem

GloWe messaging already rides KC's shared `public.chats` / `public.messages` (D-69): inbox, thread view, send, mark-read, unread header badge. However:

1. **No Realtime** — new messages only appear after a manual refresh or re-send; the header badge updates only on page load.
2. **Heavy send UX** — every send re-fetches and re-renders the entire thread (flicker, scroll jump).
3. **No optimistic send or retry** — failed sends show a modal; no inline retry on the bubble.
4. **Thread polish gaps** — no day separators, no link to counterpart profile from the thread header.
5. **Inbox is static** — preview / sort / unread do not update when a message arrives elsewhere.

KC mobile already solves these via `SupabaseChatRealtime` + `chatStore` + `useChatSend`. GloWe is vanilla JS with no bundler; importing `@kc/infrastructure-supabase` directly is out of scope.

## Goals (GloWe-focused MVP — chat v1)

- **Core Realtime:** live message delivery in an open thread; no full re-render on send.
- **Live inbox:** preview, sort, and unread dot update when messages arrive.
- **Live header badge:** unread total updates on any page while signed in.
- **Thread UX:** day separators (Today / Yesterday / date), counterpart name links to `profile.html?id=…`, inline retry on failed send.
- **Minimal duplication:** reuse KC DB + RPCs; port only thin realtime adapter + pure display/send helpers; document parity with KC `SupabaseChatRealtime.ts`.
- **Testable:** pure logic in `glowe-messages.js` + new `glowe-chat-realtime.js` covered by vitest.

## Non-goals (this slice)

- Full KC `FR-CHAT-*` parity (read receipts ✓✓, anchor cards, support thread UI, inbox hide, search, infinite scroll).
- Follow / unfollow system (separate design).
- Shared TypeScript package or build step for GloWe.
- New migrations or RPCs (existing `rpc_chat_mark_read`, `rpc_unread_counts_for_chats`, `rpc_chat_unread_total` suffice).
- KC mobile changes.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  app.js (chat UI controller)                            │
│  - thread view / inbox view                             │
│  - incremental DOM updates                              │
│  - subscription lifecycle (mount/unmount)                 │
└────────────┬───────────────────────────┬────────────────┘
             │                           │
┌────────────▼────────────┐   ┌──────────▼─────────────────┐
│ glowe-messages.js       │   │ glowe-chat-realtime.js     │
│ (pure, unit-tested)     │   │ (thin Supabase channels)   │
│ - day separators        │   │ - subscribeToChat()        │
│ - optimistic reconcile  │   │ - subscribeToInbox()       │
│ - inbox patch helpers   │   │ - mirrors KC IChatRealtime │
│ - failed bubble state   │   └──────────┬─────────────────┘
└─────────────────────────┘              │
                              ┌──────────▼─────────────────┐
                              │ backend.js                 │
                              │ kcSendMessage, kcMarkRead  │
                              │ kcSubscribe* (new)         │
                              │ getClient (existing)       │
                              └──────────┬─────────────────┘
                                         │
                              ┌──────────▼─────────────────┐
                              │ KC Supabase (existing)     │
                              │ public.chats / messages    │
                              └────────────────────────────┘
```

### New / modified files

| File | Change |
|------|--------|
| `js/glowe-chat-realtime.js` | **New** — channel subscribe/unsubscribe |
| `js/__tests__/glowe-chat-realtime.test.js` | **New** — mock client channel tests where feasible |
| `js/glowe-messages.js` | **Extend** — day grouping, optimistic reconcile, inbox patch, dedupe |
| `js/__tests__/glowe-messages.test.js` | **Extend** — cover new pure helpers |
| `js/backend.js` | **Extend** — `kcSubscribeToChat`, `kcSubscribeToInbox` wrappers |
| `js/app.js` | **Refactor** — chat controller, incremental render, global inbox sub for badge |
| `pages/messages.html` | **Add** script tag for `glowe-chat-realtime.js` |
| `css/styles.css` | Day separator pill, pending/failed bubble, retry button |
| `docs/SSOT/DECISIONS.md` | **Add** D-182 at implementation |
| `docs/SSOT/BACKLOG.md` | **Add** GLOWE.C1 slice, flip to 🟡 on start |

---

## Data flow

### Thread view (`messages.html?chat=<id>`)

**On open**

1. Load messages via `kcGetMessages(chatId)`.
2. Resolve counterpart via `kcCounterpartProfiles` → header **linked name** → `profile.html?id=<otherId>` (fallback: plain "GloWe member" when id missing).
3. Render bubbles with **day separators** between local-calendar-day groups.
4. Subscribe to chat channel: `INSERT`/`UPDATE` on `messages` (filter `chat_id`), `UPDATE` on `chats`.
5. Call `kcMarkChatRead(chatId)`.

**On send**

1. `GloweMessages.validateMessageDraft`.
2. **Optimistic append** — bubble with `pending` state; clear composer.
3. `kcSendMessage` → success: `reconcileOptimistic` with server row (match pending by `clientId` + body + sender, same idea as KC `chatStore.reconcileSent`).
4. Failure: mark bubble `failed`; show retry control; tap retries same body (no second optimistic row).

**On realtime `INSERT`**

- If `message_id` not in DOM → append + scroll to bottom.
- Counterpart message → `kcMarkChatRead`.
- Dedupe against optimistic rows and duplicate events.

**On teardown**

- Unsubscribe chat channel when leaving thread or signing out.

### Inbox view (`messages.html`)

**On open**

1. Existing load: chats, previews, unread, profiles.
2. Subscribe to inbox channel: `INSERT` on `messages`, `UPDATE` on `chats`.

**On realtime event**

- Existing chat: update preview, timestamp, move row to top, bump unread (unless user is in that open thread).
- New chat (first message): re-fetch inbox or patch in new row.
- Re-sort by `last_message_at DESC`.

### Header badge (all pages)

- Start inbox subscription when user is logged in (`ensureGlobalUI` / post-auth), not only on `messages.html`.
- On inbox message events → debounced (200 ms) `kcUnreadTotal()` → `applyMessagesBadge` (same debounce as KC `SupabaseChatRealtime`).

---

## Pure helpers (`glowe-messages.js`)

| Function | Purpose |
|----------|---------|
| `groupMessagesWithDaySeparators(messages, nowMs, labelFn)` | Render items: `{ type: 'day', label }` \| `{ type: 'msg', ... }` |
| `dayLabelForIso(iso, nowMs, labelFn)` | Today / Yesterday / weekday date (locale via `labelFn` + GLOWE_TRANSLATIONS) |
| `reconcileOptimistic(messages, serverRow, clientId)` | Replace pending bubble with server message |
| `markMessageFailed(messages, clientId)` | Set `failed: true` on optimistic row |
| `patchInboxOnNewMessage(inbox, message, meId, openChatId)` | Sort, preview, unread bump |
| `shouldDedupeIncoming(existing, incoming)` | Prevent double bubbles by `message_id` |

`labelFn` receives keys `'today'`, `'yesterday'` so Hebrew locale keys stay in `GLOWE_TRANSLATIONS` (same pattern as other GloWe strings).

---

## Realtime adapter (`glowe-chat-realtime.js`)

Mirrors KC `SupabaseChatRealtime` contract (not imported — documented parity):

**`subscribeToChat(client, chatId, callbacks)`**

- `onMessage(row)` — INSERT on `messages` where `chat_id=eq.<chatId>`
- `onMessageStatusChanged(row)` — UPDATE on `messages` (reserved for future read receipts; no UI in v1)
- `onChatChanged(row)` — UPDATE on `chats`
- `onError(err)` — `CHANNEL_ERROR` / `TIMED_OUT`
- Returns `unsubscribe()` — `removeChannel`

**`subscribeToInbox(client, userId, callbacks)`**

- `onInboxMessageInsert(row)` — INSERT on `messages` (RLS filters to visible chats)
- `onChatChanged(row)` — UPDATE on `chats`
- `onUnreadTotalChanged(n)` — debounced RPC `rpc_chat_unread_total`
- Returns `unsubscribe()`

Channel topic suffix uses random id (same as KC) to avoid cached-channel reuse on re-mount.

`backend.js` exposes:

```js
kcSubscribeToChat(chatId, callbacks) → unsubscribe
kcSubscribeToInbox(callbacks) → unsubscribe
```

Both use `getClient()` internally; return no-op unsubscribe when signed out.

---

## Error handling

| Scenario | Behavior |
|----------|----------|
| Realtime channel fails | Log; chat still works via load/send. No blocking modal. |
| Send fails | Bubble `failed` + retry; no success modal. |
| Duplicate realtime event | Dedupe by `message_id`; reconcile optimistic by `clientId`. |
| Counterpart deleted | Header: "GloWe member", no profile link. |
| Sign out while subscribed | Unsubscribe all in `signOut` + chat teardown. |
| Tab backgrounded | On `SUBSCRIBED` after reconnect, re-fetch thread messages to fill gaps. |

---

## UI (CSS)

- `.chat-day-separator` — centered pill between day groups.
- `.chat-bubble.pending` — reduced opacity while sending.
- `.chat-bubble.failed` + `.chat-retry-btn` — inline retry.
- Thread header: `<a href="profile.html?id=…">` around counterpart name.

---

## Testing

### Unit (vitest — required gate)

- Day separator grouping (today / yesterday / older year).
- Optimistic reconcile + dedupe.
- Inbox patch (sort, preview, unread skip when thread open).
- Failed → retry state (same `clientId`).

### Manual QA

- Two browsers / personas: message appears live without refresh.
- Send: instant bubble, no full-page flicker.
- Offline send → retry succeeds.
- Inbox updates when message arrives on another page.
- Header badge updates live.
- Profile link correct; Hebrew day labels.

### E2E (stretch)

- `glowe-messages-realtime.spec.ts` — two persona sign-in, send, assert DOM. Not blocking v1 merge if flaky on Realtime timing.

---

## SSOT updates (same PR as code)

1. `BACKLOG.md` — `GLOWE.C1` GloWe chat Realtime + thread UX → ✅ on merge.
2. `DECISIONS.md` — D-182: GloWe chat realtime via thin JS adapter mirroring KC `SupabaseChatRealtime`; no shared package.
3. `spec/17_glowe_frontend.md` — note under FR-GLOWE-014/016 that Realtime + thread polish shipped (reference this design).
4. Bump `app/VERSION` PATCH per org policy.

---

## Follow-up (out of scope — separate designs)

- GloWe follow system (public follow/unfollow on profiles).
- Read receipts, anchor cards, inbox hide, search, pagination.
- FR-RESP-004 two-pane messages layout at ≥768px.
