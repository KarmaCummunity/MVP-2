# GloWe Chat Realtime + Thread UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship live GloWe direct messaging — Realtime delivery, live inbox + header badge, optimistic send with inline retry, day separators, and profile link in thread header — per approved design `docs/superpowers/specs/2026-07-19-glowe-chat-realtime-design.md`.

**Architecture:** Pure logic stays in `glowe-messages.js` (unit-tested). A thin `glowe-chat-realtime.js` mirrors KC `SupabaseChatRealtime.ts` channel contracts. `backend.js` exposes subscribe wrappers. UI orchestration moves into new `glowe-chat-ui.js` so `app.js` only wires page init + global badge subscription (keeps `app.js` from growing further).

**Tech Stack:** GloWe vanilla JS (`app/apps/glowe-web`), Supabase JS client (`window.supabase`), Vitest (`pnpm --filter @kc/glowe-web test`), existing KC RPCs (`rpc_chat_mark_read`, `rpc_unread_counts_for_chats`, `rpc_chat_unread_total`).

## Global Constraints

- Branch from latest `origin/dev`: `feat/FR-GLOWE-014-chat-realtime`.
- No new DB migrations or RPCs in this slice.
- No bundler / no importing `@kc/infrastructure-supabase` from GloWe.
- Pure modules must stay DOM-free (same IIFE + `module.exports` pattern as `glowe-messages.js`).
- File size cap ≤300 lines per file — split if a file approaches the limit.
- UI strings: English source + `GLOWE_TRANSLATIONS.he` keys in `app.js`.
- Pre-push from `app/`: `pnpm typecheck && pnpm test && pnpm lint`.
- PR targets `dev`; bump PATCH in `app/VERSION` + `app/apps/glowe-web/js/glowe-version.js`.
- Mapped to spec: FR-CHAT-001, FR-CHAT-002, FR-CHAT-003, FR-GLOWE-014 / FR-GLOWE-016 AC6.

## File map

| File | Role |
|------|------|
| `app/apps/glowe-web/js/glowe-messages.js` | **Modify** — day separators, optimistic/reconcile, inbox patch, dedupe |
| `app/apps/glowe-web/js/__tests__/glowe-messages.test.js` | **Modify** — tests for new pure helpers |
| `app/apps/glowe-web/js/glowe-chat-realtime.js` | **Create** — Supabase channel subscribe/unsubscribe |
| `app/apps/glowe-web/js/__tests__/glowe-chat-realtime.test.js` | **Create** — mock-client tests |
| `app/apps/glowe-web/js/glowe-chat-ui.js` | **Create** — inbox/thread controller, incremental DOM |
| `app/apps/glowe-web/js/backend.js` | **Modify** — `kcSubscribeToChat`, `kcSubscribeToInbox` |
| `app/apps/glowe-web/js/app.js` | **Modify** — thin wiring, global inbox sub, HE keys, remove inlined chat block |
| `app/apps/glowe-web/pages/messages.html` | **Modify** — script tags for new modules |
| `app/apps/glowe-web/css/styles.css` | **Modify** — day separator, pending/failed bubbles, retry |
| `docs/SSOT/DECISIONS.md` | **Modify** — D-182 |
| `docs/SSOT/BACKLOG.md` | **Modify** — GLOWE.C1 row |
| `docs/SSOT/spec/17_glowe_frontend.md` | **Modify** — FR-GLOWE-014 Realtime note |

---

### Task 1: Pure message helpers (TDD)

**Files:**
- Modify: `app/apps/glowe-web/js/glowe-messages.js`
- Modify: `app/apps/glowe-web/js/__tests__/glowe-messages.test.js`

**Interfaces:**
- Produces: `dayLabelForIso`, `groupMessagesWithDaySeparators`, `createOptimisticMessage`, `reconcileOptimistic`, `markMessageFailed`, `shouldDedupeIncoming`, `patchInboxOnNewMessage`

- [ ] **Step 1: Write failing tests**

Add to `glowe-messages.test.js`:

```javascript
describe('dayLabelForIso / groupMessagesWithDaySeparators', () => {
  const NOW = Date.parse('2026-07-19T15:00:00Z');
  const labels = (k) => ({ today: 'Today', yesterday: 'Yesterday' }[k] || k);

  it('labels today and yesterday', () => {
    expect(GloweMessages.dayLabelForIso('2026-07-19T10:00:00Z', NOW, labels)).toBe('Today');
    expect(GloweMessages.dayLabelForIso('2026-07-18T10:00:00Z', NOW, labels)).toBe('Yesterday');
  });

  it('inserts day separators between messages', () => {
    const msgs = [
      { id: 'm1', text: 'a', createdAt: '2026-07-18T10:00:00Z', mine: false, isSystem: false },
      { id: 'm2', text: 'b', createdAt: '2026-07-19T10:00:00Z', mine: true, isSystem: false }
    ];
    const items = GloweMessages.groupMessagesWithDaySeparators(msgs, NOW, labels);
    expect(items.filter(i => i.type === 'day').length).toBe(2);
    expect(items.filter(i => i.type === 'msg').map(i => i.id)).toEqual(['m1', 'm2']);
  });
});

describe('optimistic send helpers', () => {
  const ME = 'aaaaaaaa-0000-0000-0000-000000000001';
  const CHAT = 'cccccccc-0000-0000-0000-000000000003';

  it('creates a pending optimistic row', () => {
    const row = GloweMessages.createOptimisticMessage('client-1', ME, CHAT, 'hello');
    expect(row).toMatchObject({ clientId: 'client-1', pending: true, failed: false, mine: true, text: 'hello' });
  });

  it('reconciles pending with server row', () => {
    const list = [GloweMessages.createOptimisticMessage('client-1', ME, CHAT, 'hello')];
    const server = { message_id: 'srv-1', sender_id: ME, body: 'hello', created_at: '2026-07-19T10:00:00Z', kind: 'user' };
    const out = GloweMessages.reconcileOptimistic(list, server, 'client-1', ME);
    expect(out[0]).toMatchObject({ id: 'srv-1', pending: false, failed: false });
  });

  it('marks failed without removing the row', () => {
    const list = [GloweMessages.createOptimisticMessage('client-1', ME, CHAT, 'hello')];
    const out = GloweMessages.markMessageFailed(list, 'client-1');
    expect(out[0]).toMatchObject({ failed: true, pending: false });
  });
});

describe('shouldDedupeIncoming / patchInboxOnNewMessage', () => {
  const ME = 'aaaaaaaa-0000-0000-0000-000000000001';
  const OTHER = 'bbbbbbbb-0000-0000-0000-000000000002';

  it('dedupes by message_id', () => {
    const existing = [{ id: 'm1', text: 'hi' }];
    expect(GloweMessages.shouldDedupeIncoming(existing, { message_id: 'm1', body: 'hi' })).toBe(true);
    expect(GloweMessages.shouldDedupeIncoming(existing, { message_id: 'm2', body: 'yo' })).toBe(false);
  });

  it('moves chat to top and updates preview on new message', () => {
    const inbox = [
      { chatId: 'c2', otherId: OTHER, previewText: 'old', previewAt: '2026-07-18', unread: 0, lastMessageAt: '2026-07-18' },
      { chatId: 'c1', otherId: ME, previewText: 'x', previewAt: '2026-07-17', unread: 1, lastMessageAt: '2026-07-17' }
    ];
    const row = { chat_id: 'c2', sender_id: OTHER, body: 'new', created_at: '2026-07-19T12:00:00Z' };
    const out = GloweMessages.patchInboxOnNewMessage(inbox, row, ME, null);
    expect(out[0].chatId).toBe('c2');
    expect(out[0].previewText).toBe('new');
    expect(out[0].unread).toBe(1);
  });

  it('does not bump unread when that chat is open', () => {
    const inbox = [{ chatId: 'c1', otherId: OTHER, previewText: 'x', previewAt: '2026-07-17', unread: 0, lastMessageAt: '2026-07-17' }];
    const row = { chat_id: 'c1', sender_id: OTHER, body: 'new', created_at: '2026-07-19T12:00:00Z' };
    const out = GloweMessages.patchInboxOnNewMessage(inbox, row, ME, 'c1');
    expect(out[0].unread).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd app/apps/glowe-web && pnpm test -- js/__tests__/glowe-messages.test.js
```

Expected: FAIL — `dayLabelForIso is not a function`

- [ ] **Step 3: Implement helpers in `glowe-messages.js`**

Append before `return {`:

```javascript
    function startOfLocalDay(d) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    }

    function dayLabelForIso(iso, nowMs, labelFn) {
        const d = new Date(iso);
        const now = new Date(typeof nowMs === 'number' ? nowMs : Date.now());
        const diffDays = Math.round((startOfLocalDay(now) - startOfLocalDay(d)) / 86400000);
        if (diffDays === 0) return labelFn('today');
        if (diffDays === 1) return labelFn('yesterday');
        const sameYear = d.getFullYear() === now.getFullYear();
        try {
            return d.toLocaleDateString(undefined, {
                weekday: 'long', day: 'numeric', month: 'long',
                ...(sameYear ? {} : { year: 'numeric' })
            });
        } catch (_e) {
            return d.toISOString().slice(0, 10);
        }
    }

    function groupMessagesWithDaySeparators(messages, nowMs, labelFn) {
        const out = [];
        let lastDay = '';
        (Array.isArray(messages) ? messages : []).forEach(function (m) {
            const dayKey = String(m.createdAt || '').slice(0, 10);
            if (dayKey && dayKey !== lastDay) {
                lastDay = dayKey;
                out.push({ type: 'day', label: dayLabelForIso(m.createdAt, nowMs, labelFn) });
            }
            out.push({ type: 'msg', message: m });
        });
        return out;
    }

    function createOptimisticMessage(clientId, meId, chatId, body) {
        return {
            clientId: String(clientId),
            id: String(clientId),
            chatId: String(chatId),
            mine: true,
            isSystem: false,
            text: String(body),
            createdAt: new Date().toISOString(),
            pending: true,
            failed: false
        };
    }

    function reconcileOptimistic(messages, serverRow, clientId, meId) {
        const mapped = mapMessageRow(serverRow, meId);
        return (Array.isArray(messages) ? messages : []).map(function (m) {
            if (m.clientId === clientId || (m.pending && m.text === mapped.text && m.mine)) {
                return Object.assign({}, mapped, { clientId: m.clientId, pending: false, failed: false });
            }
            return m;
        });
    }

    function markMessageFailed(messages, clientId) {
        return (Array.isArray(messages) ? messages : []).map(function (m) {
            if (m.clientId === clientId) return Object.assign({}, m, { pending: false, failed: true });
            return m;
        });
    }

    function shouldDedupeIncoming(existing, incomingRow) {
        const id = incomingRow && (incomingRow.message_id || incomingRow.id);
        if (!id) return false;
        return (Array.isArray(existing) ? existing : []).some(function (m) {
            return String(m.id) === String(id);
        });
    }

    function patchInboxOnNewMessage(inbox, messageRow, meId, openChatId) {
        const chatId = String(messageRow.chat_id || '');
        const body = String(messageRow.body || '');
        const at = messageRow.created_at || '';
        const senderId = String(messageRow.sender_id || '');
        const list = (Array.isArray(inbox) ? inbox : []).map(function (c) { return Object.assign({}, c); });
        const idx = list.findIndex(function (c) { return String(c.chatId) === chatId; });
        const bumpUnread = openChatId !== chatId && senderId !== String(meId);
        if (idx >= 0) {
            const row = list[idx];
            row.previewText = body;
            row.previewAt = at;
            row.lastMessageAt = at;
            if (bumpUnread) row.unread = (Number(row.unread) || 0) + 1;
            list.splice(idx, 1);
            list.unshift(row);
            return list;
        }
        return list;
    }
```

Export new functions on the returned API object.

- [ ] **Step 4: Run tests**

```bash
cd app/apps/glowe-web && pnpm test -- js/__tests__/glowe-messages.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/apps/glowe-web/js/glowe-messages.js app/apps/glowe-web/js/__tests__/glowe-messages.test.js
git commit -m "feat(glowe): add pure chat helpers for realtime UX"
```

---

### Task 2: Realtime adapter module

**Files:**
- Create: `app/apps/glowe-web/js/glowe-chat-realtime.js`
- Create: `app/apps/glowe-web/js/__tests__/glowe-chat-realtime.test.js`

**Interfaces:**
- Consumes: Supabase client with `.channel().on().subscribe()` and `.removeChannel()`
- Produces: `subscribeToChat(client, chatId, callbacks) → unsubscribe`, `subscribeToInbox(client, userId, callbacks, options) → unsubscribe`

- [ ] **Step 1: Write failing test with mock client**

Create `glowe-chat-realtime.test.js`:

```javascript
import { describe, it, expect, vi } from 'vitest';
import GloweChatRealtime from '../glowe-chat-realtime.js';

function mockClient() {
  const handlers = [];
  const channel = {
    on: vi.fn(function (_event, _filter, cb) {
      handlers.push(cb);
      return channel;
    }),
    subscribe: vi.fn(function (statusCb) {
      if (statusCb) statusCb('SUBSCRIBED');
      return channel;
    })
  };
  return {
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(),
    rpc: vi.fn(async () => ({ data: 3, error: null })),
    _handlers: handlers,
    _channel: channel
  };
}

describe('subscribeToChat', () => {
  it('registers INSERT on messages and returns unsubscribe', () => {
    const client = mockClient();
    const onMessage = vi.fn();
    const unsub = GloweChatRealtime.subscribeToChat(client, 'chat-1', { onMessage });
    expect(client.channel).toHaveBeenCalled();
    expect(client._channel.on).toHaveBeenCalled();
    unsub();
    expect(client.removeChannel).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd app/apps/glowe-web && pnpm test -- js/__tests__/glowe-chat-realtime.test.js
```

- [ ] **Step 3: Create `glowe-chat-realtime.js`**

Mirror KC `SupabaseChatRealtime.ts` (lines 21–125) in vanilla JS:

```javascript
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.GloweChatRealtime = api;
})(typeof self !== 'undefined' ? self : this, function () {
    const UNREAD_DEBOUNCE_MS = 200;

    function subscribeToChat(client, chatId, cb) {
        if (!client || !chatId) return function () {};
        const topic = 'chat:' + chatId + ':' + Math.random().toString(36).slice(2, 10);
        const channel = client.channel(topic)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'chat_id=eq.' + chatId },
                function (payload) { if (cb.onMessage) cb.onMessage(payload.new); })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: 'chat_id=eq.' + chatId },
                function (payload) { if (cb.onMessageStatusChanged) cb.onMessageStatusChanged(payload.new); })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chats', filter: 'chat_id=eq.' + chatId },
                function (payload) { if (cb.onChatChanged) cb.onChatChanged(payload.new); })
            .subscribe(function (status) {
                if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && cb.onError) {
                    cb.onError(new Error('chat channel ' + status.toLowerCase()));
                }
            });
        return function () { void client.removeChannel(channel); };
    }

    function subscribeToInbox(client, userId, cb, options) {
        if (!client || !userId) return function () {};
        let unreadTimer = null;
        function fireUnreadDebounced() {
            if (unreadTimer) clearTimeout(unreadTimer);
            unreadTimer = setTimeout(async function () {
                const getE = options && options.getSnapshotEpoch;
                const e0 = getE ? getE() : 0;
                const res = await client.rpc('rpc_chat_unread_total');
                if (getE && getE() !== e0) return;
                if (!res.error && cb.onUnreadTotalChanged) cb.onUnreadTotalChanged(Number(res.data || 0));
            }, UNREAD_DEBOUNCE_MS);
        }
        const topic = 'inbox:' + userId + ':' + Math.random().toString(36).slice(2, 10);
        const channel = client.channel(topic)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
                function (payload) {
                    if (cb.onInboxMessageInsert) cb.onInboxMessageInsert(payload.new);
                    fireUnreadDebounced();
                })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' },
                function () { fireUnreadDebounced(); })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chats' },
                function (payload) { if (cb.onChatChanged) cb.onChatChanged(payload.new); })
            .subscribe();
        return function () {
            if (unreadTimer) clearTimeout(unreadTimer);
            void client.removeChannel(channel);
        };
    }

    return { subscribeToChat: subscribeToChat, subscribeToInbox: subscribeToInbox };
});
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add app/apps/glowe-web/js/glowe-chat-realtime.js app/apps/glowe-web/js/__tests__/glowe-chat-realtime.test.js
git commit -m "feat(glowe): add thin Supabase chat realtime adapter"
```

---

### Task 3: Backend subscribe wrappers

**Files:**
- Modify: `app/apps/glowe-web/js/backend.js` (KC messaging section ~line 805)

**Interfaces:**
- Consumes: `GloweChatRealtime.subscribeToChat`, `GloweChatRealtime.subscribeToInbox`
- Produces: `window.gloweBackend.kcSubscribeToChat`, `window.gloweBackend.kcSubscribeToInbox`

- [ ] **Step 1: Add wrappers after existing `kcMarkChatRead`**

```javascript
    async function kcSubscribeToChat(chatId, callbacks) {
        const client = await getClient();
        const user = await currentUser();
        if (!client || !user || !chatId || typeof window.GloweChatRealtime === 'undefined') {
            return function () {};
        }
        return window.GloweChatRealtime.subscribeToChat(client, chatId, callbacks || {});
    }

    async function kcSubscribeToInbox(callbacks, options) {
        const client = await getClient();
        const user = await currentUser();
        if (!client || !user || typeof window.GloweChatRealtime === 'undefined') {
            return function () {};
        }
        return window.GloweChatRealtime.subscribeToInbox(client, user.id, callbacks || {}, options || {});
    }
```

Export both on `window.gloweBackend`.

- [ ] **Step 2: Smoke-check in browser console** (manual): after loading `messages.html`, `typeof gloweBackend.kcSubscribeToInbox === 'function'`.

- [ ] **Step 3: Commit**

```bash
git add app/apps/glowe-web/js/backend.js
git commit -m "feat(glowe): expose chat realtime subscribe helpers on backend"
```

---

### Task 4: Chat UI controller (`glowe-chat-ui.js`)

**Files:**
- Create: `app/apps/glowe-web/js/glowe-chat-ui.js`
- Modify: `app/apps/glowe-web/js/app.js` — replace inlined chat functions with thin delegates
- Modify: `app/apps/glowe-web/pages/messages.html` — script includes **before** `app.js`:

```html
<script src="../js/glowe-chat-realtime.js"></script>
<script src="../js/glowe-chat-ui.js"></script>
```

**Interfaces:**
- Consumes: `GloweMessages.*`, `gloweBackend.kc*`, existing `escapeHtml`, `jsString`, `renderEntityMark`, `fieldValue`, `showSuccessModal`, `applyMessagesBadge` (expose `applyMessagesBadge` on window or pass via init)
- Produces: `window.GloweChatUI.initMessagesPage()`, `window.GloweChatUI.startGlobalInboxSubscription()`, `window.GloweChatUI.teardownAll()`

- [ ] **Step 1: Create `glowe-chat-ui.js` skeleton with module state**

```javascript
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.GloweChatUI = api;
})(typeof self !== 'undefined' ? self : this, function () {
    let threadUnsub = null;
    let inboxPageUnsub = null;
    let globalInboxUnsub = null;
    let threadMessages = [];
    let openChatId = null;
    let counterpartId = null;

    function chatDayLabels() {
        return function (key) {
            if (key === 'today') return 'Today';
            if (key === 'yesterday') return 'Yesterday';
            return key;
        };
    }

    // renderChatBubblesFromItems, appendMessageBubble, rerenderThreadMessages,
    // renderChatInbox, renderChatThread, handleChatSend, handleChatRetry
    // — move logic from app.js; use incremental DOM for send/realtime

    return {
        initMessagesPage: initMessagesPage,
        startGlobalInboxSubscription: startGlobalInboxSubscription,
        teardownAll: teardownAll,
        getOpenChatId: function () { return openChatId; }
    };
});
```

- [ ] **Step 2: Implement thread render with day separators + profile link**

Thread header pattern:

```javascript
const profileHref = counterpartId
    ? 'profile.html?id=' + encodeURIComponent(counterpartId)
    : null;
const nameHtml = profileHref
    ? '<a href="' + profileHref + '">' + escapeHtml(counterpartName) + '</a>'
    : escapeHtml(counterpartName);
```

Bubble render uses `GloweMessages.groupMessagesWithDaySeparators(threadMessages, Date.now(), chatDayLabels())` emitting:

```html
<div class="chat-day-separator"><span>Today</span></div>
<div class="chat-bubble mine pending" data-client-id="...">...</div>
<div class="chat-bubble failed" data-client-id="...">
  <p>...</p>
  <button type="button" class="chat-retry-btn" data-client-id="...">Retry</button>
</div>
```

- [ ] **Step 3: Optimistic send + retry (no full re-render)**

```javascript
async function handleChatSend(event, chatId) {
    event.preventDefault();
    const text = deps.fieldValue('chat-send-input');
    const check = GloweMessages.validateMessageDraft(text);
    if (!check.valid) return;
    const clientId = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now());
    const me = await deps.backend.currentUser();
    threadMessages = threadMessages.concat(
        GloweMessages.createOptimisticMessage(clientId, me.id, chatId, text)
    );
    deps.clearField('chat-send-input');
    rerenderThreadMessages();
    const sent = await deps.backend.kcSendMessage(chatId, text).catch(() => null);
    if (!sent) {
        threadMessages = GloweMessages.markMessageFailed(threadMessages, clientId);
    } else {
        threadMessages = GloweMessages.reconcileOptimistic(threadMessages, sent, clientId, me.id);
    }
    rerenderThreadMessages();
}
```

Wire retry via delegated click on `.chat-retry-btn` calling `kcSendMessage` with stored body.

- [ ] **Step 4: Subscribe on thread open; append on realtime INSERT**

```javascript
function teardownThreadSub() {
    if (threadUnsub) { threadUnsub(); threadUnsub = null; }
}

async function subscribeThread(chatId, meId) {
    teardownThreadSub();
    threadUnsub = await deps.backend.kcSubscribeToChat(chatId, {
        onMessage: function (row) {
            if (GloweMessages.shouldDedupeIncoming(threadMessages, row)) return;
            threadMessages = threadMessages.concat(GloweMessages.mapMessageRow(row, meId));
            rerenderThreadMessages();
            if (String(row.sender_id) !== String(meId)) {
                deps.backend.kcMarkChatRead(chatId).catch(function () {});
            }
        },
        onError: function (err) { console.warn('chat realtime', err); }
    });
}
```

On `SUBSCRIBED` reconnect: optionally `kcGetMessages` merge (gap fill).

- [ ] **Step 5: Live inbox — keep in-memory inbox array, patch on realtime**

Store `inboxState` `{ chats, profiles }` at module scope. On `onInboxMessageInsert`, run `GloweMessages.patchInboxOnNewMessage` and re-render list DOM only (not full page).

- [ ] **Step 6: Slim `app.js`**

Replace chat block (~`initMessagesPage` through `refreshMessagesBadge` helpers) with:

```javascript
function initMessagesPage() {
    if (window.GloweChatUI) window.GloweChatUI.initMessagesPage();
}
async function refreshMessagesBadge() {
    if (!backendReady() || !gloweIsLoggedIn()) return;
    const total = await window.gloweBackend.kcUnreadTotal().catch(() => 0);
    applyMessagesBadge(total);
}
```

In `DOMContentLoaded` after auth ready, call `GloweChatUI.startGlobalInboxSubscription({ onUnreadTotalChanged: applyMessagesBadge })`.

In `auth.js` logout path, call `GloweChatUI.teardownAll()`.

- [ ] **Step 7: Manual QA** — two-browser live message test (design doc checklist).

- [ ] **Step 8: Commit**

```bash
git add app/apps/glowe-web/js/glowe-chat-ui.js app/apps/glowe-web/js/app.js app/apps/glowe-web/pages/messages.html app/apps/glowe-web/js/auth.js
git commit -m "feat(glowe): realtime chat UI with optimistic send and live inbox"
```

---

### Task 5: CSS + Hebrew locale keys

**Files:**
- Modify: `app/apps/glowe-web/css/styles.css`
- Modify: `app/apps/glowe-web/js/app.js` (`GLOWE_TRANSLATIONS.he`)

- [ ] **Step 1: Add styles**

```css
.chat-day-separator {
    display: flex;
    justify-content: center;
    margin: 0.75rem 0;
}
.chat-day-separator span {
    font-size: 0.75rem;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    background: var(--surface-muted, #f3f0ec);
    color: var(--text-muted, #6b6560);
}
.chat-bubble.pending { opacity: 0.7; }
.chat-bubble.failed { border: 1px solid #c44; }
.chat-retry-btn {
    margin-top: 0.25rem;
    font-size: 0.75rem;
    text-decoration: underline;
    background: none;
    border: none;
    cursor: pointer;
}
.chat-thread-header a { color: inherit; text-decoration: underline; }
```

- [ ] **Step 2: Add HE keys**

```javascript
"Today": "היום",
"Yesterday": "אתמול",
"Retry": "נסה שוב",
"No messages yet. Say hello!": "אין הודעות עדיין. אמור שלום!",
```

- [ ] **Step 3: Commit**

```bash
git add app/apps/glowe-web/css/styles.css app/apps/glowe-web/js/app.js
git commit -m "style(glowe): chat day separators and failed-send affordances"
```

---

### Task 6: SSOT + version bump + verification

**Files:**
- Modify: `docs/SSOT/DECISIONS.md`, `docs/SSOT/BACKLOG.md`, `docs/SSOT/spec/17_glowe_frontend.md`
- Modify: `app/VERSION`, `app/apps/glowe-web/js/glowe-version.js`

- [ ] **Step 1: Add D-182** — GloWe chat Realtime via thin JS adapter mirroring KC `SupabaseChatRealtime`; no shared TS package; no GloWe build step.

- [ ] **Step 2: BACKLOG** — add `GLOWE.C1 | GloWe chat Realtime + thread UX | ✅ Done` referencing this plan.

- [ ] **Step 3: spec/17** — under FR-GLOWE-014, note Realtime + optimistic send + day separators shipped (2026-07-19).

- [ ] **Step 4: Bump version** `1.0.4` → `1.0.5` in both VERSION files.

- [ ] **Step 5: Run full gates**

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
cd app/apps/glowe-web && pnpm test
```

Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add docs/SSOT/DECISIONS.md docs/SSOT/BACKLOG.md docs/SSOT/spec/17_glowe_frontend.md app/VERSION app/apps/glowe-web/js/glowe-version.js
git commit -m "docs(ssot): record GloWe chat realtime slice D-182"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Realtime in open thread | Task 2, 4 |
| Live inbox sort/preview/unread | Task 1, 4 |
| Live header badge | Task 3, 4 |
| Optimistic send + retry | Task 1, 4 |
| Day separators | Task 1, 4, 5 |
| Profile link in header | Task 4 |
| Sign-out unsub | Task 4 |
| Unit tests | Task 1, 2 |
| SSOT / version | Task 6 |

## Follow-up (not in this plan)

- GloWe follow system (separate design).
- E2E `glowe-messages-realtime.spec.ts` (stretch).
- Read receipts, anchor cards, inbox hide, search, FR-RESP-004 two-pane layout.
