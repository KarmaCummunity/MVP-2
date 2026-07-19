// Thin Supabase realtime adapter for GloWe chat (mirrors KC SupabaseChatRealtime.ts).
// DOM-free; consumed by backend.js subscribe wrappers and unit-tested via vitest.
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
