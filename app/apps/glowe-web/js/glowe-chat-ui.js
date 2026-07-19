// GloWe chat UI controller — inbox + thread with realtime, optimistic send (FR-GLOWE-014).
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
    let counterpartName = '';
    let meId = null;
    let inboxState = { chats: [], profiles: {} };
    const retryBodies = {};

    function d() {
        return {
            esc: window.escapeHtml,
            js: window.jsString,
            mark: window.renderEntityMark,
            field: window.fieldValue,
            backend: window.gloweBackend,
            GM: window.GloweMessages,
            loggedIn: window.gloweIsLoggedIn,
            ready: window.backendReady
        };
    }

    function dayLabels() {
        return function (key) { return key === 'today' ? 'Today' : (key === 'yesterday' ? 'Yesterday' : key); };
    }

    function teardownThreadSub() { if (threadUnsub) { threadUnsub(); threadUnsub = null; } }
    function teardownInboxPageSub() { if (inboxPageUnsub) { inboxPageUnsub(); inboxPageUnsub = null; } }
    function teardownGlobalInboxSub() { if (globalInboxUnsub) { globalInboxUnsub(); globalInboxUnsub = null; } }

    function messagesPageReady(container) {
        const deps = d();
        if (!deps.loggedIn()) {
            container.innerHTML = '<div class="empty-state"><h3>Sign in to see your messages</h3><p>Direct conversations with volunteers, organizations, and partners live here once you are signed in.</p><button class="btn btn-primary" type="button" onclick="openModal(\'login-modal\')">Sign up / Sign in</button></div>';
            return false;
        }
        if (!deps.ready()) {
            container.innerHTML = '<div class="empty-state"><h3>Messages are unavailable</h3><p>Messaging needs a live connection right now. Please try again shortly.</p></div>';
            return false;
        }
        return true;
    }

    function renderInboxRow(chat, profiles) {
        const deps = d();
        const name = (profiles[chat.otherId] || {}).name || 'GloWe member';
        const preview = String(chat.previewText || '').slice(0, 90);
        const badge = chat.unread ? '<span class="chat-unread-badge">' + chat.unread + '</span>' : '';
        return '<a class="chat-inbox-row' + (chat.unread ? ' has-unread' : '') + '" href="messages.html?chat=' + encodeURIComponent(chat.chatId) + '">' +
            deps.mark(name, 'avatar') + '<span class="chat-inbox-main"><strong>' + deps.esc(name) + '</strong><small>' + deps.esc(preview) + '</small></span>' +
            '<span class="chat-inbox-side"><small>' + deps.esc(deps.GM.formatChatTime(chat.previewAt || chat.lastMessageAt)) + '</small>' + badge + '</span></a>';
    }

    function renderInboxList(container) {
        container.innerHTML = '<div class="chat-inbox-list">' +
            inboxState.chats.map(function (c) { return renderInboxRow(c, inboxState.profiles); }).join('') +
            '</div>';
    }

    function renderBubble(m) {
        const deps = d();
        const cls = ['chat-bubble'];
        if (m.mine) cls.push('mine');
        if (m.isSystem) cls.push('system');
        if (m.pending) cls.push('pending');
        if (m.failed) cls.push('failed');
        let retry = '';
        if (m.failed && m.clientId) {
            retry = '<button type="button" class="chat-retry-btn" data-client-id="' + deps.esc(m.clientId) + '" onclick="handleChatRetry(\'' + deps.js(m.clientId) + '\', \'' + deps.js(openChatId) + '\')">Retry</button>';
        }
        const attr = m.clientId ? ' data-client-id="' + deps.esc(m.clientId) + '"' : '';
        return '<div class="' + cls.join(' ') + '"' + attr + '><p>' + deps.esc(m.text) + '</p><small>' +
            deps.esc(deps.GM.formatChatTime(m.createdAt)) + '</small>' + retry + '</div>';
    }

    function renderBubbles(messages) {
        const deps = d();
        if (!messages.length) return '<p class="muted-note">No messages yet. Say hello!</p>';
        const items = deps.GM.groupMessagesWithDaySeparators(messages, Date.now(), dayLabels());
        return items.map(function (item) {
            if (item.type === 'day') return '<div class="chat-day-separator"><span>' + deps.esc(item.label) + '</span></div>';
            return renderBubble(item.message);
        }).join('');
    }

    function rerenderThread() {
        const scroller = document.getElementById('chat-thread-messages');
        if (!scroller) return;
        scroller.innerHTML = renderBubbles(threadMessages);
        scroller.scrollTop = scroller.scrollHeight;
    }

    async function subscribeInboxPage(userId) {
        teardownInboxPageSub();
        const deps = d();
        inboxPageUnsub = await deps.backend.kcSubscribeToInbox({
            onInboxMessageInsert: function (row) {
                inboxState.chats = deps.GM.patchInboxOnNewMessage(inboxState.chats, row, userId, openChatId);
                const el = document.getElementById('messages-content');
                if (el && !openChatId) renderInboxList(el);
            }
        });
    }

    async function subscribeThread(chatId, userId) {
        teardownThreadSub();
        const deps = d();
        threadUnsub = await deps.backend.kcSubscribeToChat(chatId, {
            onMessage: function (row) {
                if (String(row.sender_id) === String(userId)) {
                    const pending = threadMessages.find(function (m) { return m.pending && m.text === String(row.body || ''); });
                    if (pending) {
                        threadMessages = deps.GM.reconcileOptimistic(threadMessages, row, pending.clientId, userId);
                        rerenderThread();
                        return;
                    }
                }
                if (deps.GM.shouldDedupeIncoming(threadMessages, row)) return;
                threadMessages = threadMessages.concat(deps.GM.mapMessageRow(row, userId));
                rerenderThread();
                if (String(row.sender_id) !== String(userId)) deps.backend.kcMarkChatRead(chatId).catch(function () {});
            },
            onError: function (err) { console.warn('chat realtime', err); }
        });
    }

    async function renderChatInbox(container) {
        const deps = d();
        container.innerHTML = '<div class="empty-state"><h3>Loading…</h3><p>Fetching your conversations.</p></div>';
        const me = await deps.backend.currentUser().catch(function () { return null; });
        if (!me) return;
        meId = me.id;
        const rows = await deps.backend.kcListMyChats().catch(function () { return []; });
        let chats = deps.GM.inboxRows(rows, me.id);
        if (!chats.length) {
            inboxState = { chats: [], profiles: {} };
            container.innerHTML = '<div class="empty-state"><h3>No conversations yet</h3><p>Reach out to an organization, offer help on a need, or message a community member — conversations will appear here.</p><div class="modal-actions"><a class="btn btn-primary" href="organizations.html">Browse Organizations</a><a class="btn btn-outline" href="wishing-well.html">Open the Wishing Well</a></div></div>';
            return;
        }
        const ids = chats.map(function (c) { return c.chatId; });
        const results = await Promise.all([
            deps.backend.kcLastMessages(ids).catch(function () { return []; }),
            deps.backend.kcUnreadCounts(ids).catch(function () { return []; }),
            deps.backend.kcCounterpartProfiles(chats.map(function (c) { return c.otherId; })).catch(function () { return {}; })
        ]);
        chats = deps.GM.attachUnread(deps.GM.attachPreviews(chats, results[0]), results[1]);
        inboxState = { chats: chats, profiles: results[2] };
        renderInboxList(container);
        await subscribeInboxPage(me.id);
    }

    async function resolveCounterpart(backend, chatId, userId) {
        const deps = d();
        const rows = await backend.kcListMyChats(50).catch(function () { return []; });
        const row = rows.find(function (c) { return String(c.chat_id) === String(chatId); });
        if (!row) return { id: null, name: 'GloWe member' };
        const mapped = deps.GM.mapChatRow(row, userId);
        const profiles = await backend.kcCounterpartProfiles([mapped.otherId]).catch(function () { return {}; });
        return { id: mapped.otherId, name: (profiles[mapped.otherId] || {}).name || 'GloWe member' };
    }

    async function renderChatThread(container, chatId) {
        const deps = d();
        container.innerHTML = '<div class="empty-state"><h3>Loading…</h3><p>Opening the conversation.</p></div>';
        const me = await deps.backend.currentUser().catch(function () { return null; });
        if (!me) return;
        meId = me.id;
        openChatId = chatId;
        let rows;
        try { rows = await deps.backend.kcGetMessages(chatId, 100); }
        catch (_e) {
            openChatId = null;
            container.innerHTML = '<div class="empty-state"><h3>Conversation unavailable</h3><p>This conversation could not be opened.</p><a class="btn btn-outline" href="messages.html">Back to messages</a></div>';
            return;
        }
        const cp = await resolveCounterpart(deps.backend, chatId, me.id);
        counterpartId = cp.id;
        counterpartName = cp.name;
        threadMessages = deps.GM.mapMessageRows(rows, me.id);
        const profileHref = counterpartId ? 'profile.html?id=' + encodeURIComponent(counterpartId) : null;
        const nameHtml = profileHref
            ? '<a href="' + profileHref + '">' + deps.esc(counterpartName) + '</a>'
            : deps.esc(counterpartName);
        container.innerHTML = '<div class="chat-thread"><div class="chat-thread-header"><a class="btn btn-outline btn-small" href="messages.html">Back</a><strong>' + nameHtml + '</strong></div>' +
            '<div class="chat-thread-messages" id="chat-thread-messages">' + renderBubbles(threadMessages) + '</div>' +
            '<form class="chat-send-form" onsubmit="handleChatSend(event, \'' + deps.js(chatId) + '\')">' +
            '<input id="chat-send-input" autocomplete="off" maxlength="2000" placeholder="Write a message...">' +
            '<button class="btn btn-primary" type="submit">Send</button></form></div>';
        const scroller = document.getElementById('chat-thread-messages');
        if (scroller) scroller.scrollTop = scroller.scrollHeight;
        deps.backend.kcMarkChatRead(chatId).catch(function () {});
        await subscribeThread(chatId, me.id);
    }

    async function handleChatSend(event, chatId) {
        event.preventDefault();
        const deps = d();
        const text = deps.field('chat-send-input');
        const check = deps.GM.validateMessageDraft(text);
        if (!check.valid) return;
        const clientId = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now());
        const me = await deps.backend.currentUser();
        if (!me) return;
        retryBodies[clientId] = text;
        threadMessages = threadMessages.concat(deps.GM.createOptimisticMessage(clientId, me.id, chatId, text));
        const input = document.getElementById('chat-send-input');
        if (input) input.value = '';
        rerenderThread();
        const sent = await deps.backend.kcSendMessage(chatId, text).catch(function () { return null; });
        threadMessages = sent
            ? deps.GM.reconcileOptimistic(threadMessages, sent, clientId, me.id)
            : deps.GM.markMessageFailed(threadMessages, clientId);
        if (sent) delete retryBodies[clientId];
        rerenderThread();
    }

    async function handleChatRetry(clientId, chatId) {
        const deps = d();
        const text = retryBodies[clientId] || (threadMessages.find(function (m) { return m.clientId === clientId; }) || {}).text;
        if (!text) return;
        const me = await deps.backend.currentUser();
        if (!me) return;
        threadMessages = threadMessages.map(function (m) {
            return m.clientId === clientId ? Object.assign({}, m, { pending: true, failed: false }) : m;
        });
        rerenderThread();
        const sent = await deps.backend.kcSendMessage(chatId, text).catch(function () { return null; });
        threadMessages = sent
            ? deps.GM.reconcileOptimistic(threadMessages, sent, clientId, me.id)
            : deps.GM.markMessageFailed(threadMessages, clientId);
        if (sent) delete retryBodies[clientId];
        rerenderThread();
    }

    function initMessagesPage() {
        const container = document.getElementById('messages-content');
        if (!container || !messagesPageReady(container)) return;
        const chatId = new URLSearchParams(window.location.search).get('chat');
        if (chatId) {
            teardownInboxPageSub();
            renderChatThread(container, chatId);
            return;
        }
        teardownThreadSub();
        openChatId = null;
        counterpartId = null;
        threadMessages = [];
        renderChatInbox(container);
    }

    async function startGlobalInboxSubscription(opts) {
        teardownGlobalInboxSub();
        const deps = d();
        if (!deps.loggedIn() || !deps.ready()) return;
        const me = await deps.backend.currentUser().catch(function () { return null; });
        if (!me) return;
        meId = me.id;
        globalInboxUnsub = await deps.backend.kcSubscribeToInbox({
            onUnreadTotalChanged: function (total) {
                if (opts && opts.onUnreadTotalChanged) opts.onUnreadTotalChanged(total);
            }
        });
    }

    function teardownAll() {
        teardownThreadSub();
        teardownInboxPageSub();
        teardownGlobalInboxSub();
        openChatId = null;
        counterpartId = null;
        threadMessages = [];
        inboxState = { chats: [], profiles: {} };
    }

    const global = typeof self !== 'undefined' ? self : this;
    global.handleChatSend = handleChatSend;
    global.handleChatRetry = handleChatRetry;

    return {
        initMessagesPage: initMessagesPage,
        startGlobalInboxSubscription: startGlobalInboxSubscription,
        teardownAll: teardownAll,
        getOpenChatId: function () { return openChatId; }
    };
});
