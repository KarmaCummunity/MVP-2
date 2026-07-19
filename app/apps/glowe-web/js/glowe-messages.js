// GloWe direct-messaging helpers (FR-GLOWE-016 AC6, supersedes FR-GLOWE-014).
//
// Pure, DOM-free logic for the messages inbox and thread view riding on KC's
// shared public.chats / public.messages (D-61). Shared by the browser app
// (window.GloweMessages) and unit-tested via vitest (module.exports), so they
// must stay free of DOM / Supabase / globals.
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.GloweMessages = api;
})(typeof self !== 'undefined' ? self : this, function () {
    // Map a chats row to the inbox view model for `meId`.
    function mapChatRow(row, meId) {
        const r = row || {};
        const me = String(meId || '');
        const a = r.participant_a == null ? '' : String(r.participant_a);
        const b = r.participant_b == null ? '' : String(r.participant_b);
        const otherId = a === me ? b : a;
        const hiddenAt = a === me ? r.inbox_hidden_at_a : r.inbox_hidden_at_b;
        return {
            chatId: r.chat_id,
            otherId: otherId,
            lastMessageAt: r.last_message_at || '',
            isSupport: Boolean(r.is_support_thread),
            hiddenForMe: Boolean(hiddenAt)
        };
    }

    // Inbox rows: mapped, visible (not hidden, not support), deduped per
    // counterpart (newest chat wins — the list arrives newest-first).
    function inboxRows(rows, meId) {
        const seen = {};
        const out = [];
        (Array.isArray(rows) ? rows : []).forEach(function (row) {
            const chat = mapChatRow(row, meId);
            if (!chat.chatId || chat.hiddenForMe || chat.isSupport || !chat.otherId) return;
            if (seen[chat.otherId]) return;
            seen[chat.otherId] = true;
            out.push(chat);
        });
        return out;
    }

    // Attach the newest message preview per chat from a mixed message list
    // (messages arrive newest-first). Mutates nothing; returns new objects.
    function attachPreviews(chats, messages) {
        const previewByChat = {};
        (Array.isArray(messages) ? messages : []).forEach(function (m) {
            if (!m || !m.chat_id) return;
            const key = String(m.chat_id);
            if (!previewByChat[key]) previewByChat[key] = m;
        });
        return (Array.isArray(chats) ? chats : []).map(function (chat) {
            const preview = previewByChat[String(chat.chatId)];
            return Object.assign({}, chat, {
                previewText: preview ? String(preview.body || '') : '',
                previewAt: preview ? preview.created_at : chat.lastMessageAt
            });
        });
    }

    // Attach unread counts from rpc_unread_counts_for_chats rows.
    function attachUnread(chats, counts) {
        const unreadByChat = {};
        (Array.isArray(counts) ? counts : []).forEach(function (c) {
            if (c && c.chat_id !== undefined) unreadByChat[String(c.chat_id)] = Number(c.unread_count) || 0;
        });
        return (Array.isArray(chats) ? chats : []).map(function (chat) {
            return Object.assign({}, chat, { unread: unreadByChat[String(chat.chatId)] || 0 });
        });
    }

    // First message seeded into a need/offer conversation — carries the item's
    // title so the owner knows the context (FR-GLOWE-016 AC6).
    function buildFirstMessage(kind, title, text) {
        const prefix = kind === 'need' ? 'Re: ' : (kind === 'org' ? 'To ' : 'Re: ');
        const head = String(title || '').trim();
        const body = String(text || '').trim();
        const parts = [];
        if (head) parts.push(prefix + head);
        if (body) parts.push(body);
        return parts.join('\n\n').slice(0, 2000);
    }

    // Map a messages row to the thread view model.
    function mapMessageRow(row, meId) {
        const r = row || {};
        return {
            id: r.message_id,
            mine: String(r.sender_id || '') === String(meId || ''),
            isSystem: r.kind === 'system',
            text: String(r.body || ''),
            createdAt: r.created_at || ''
        };
    }

    function mapMessageRows(rows, meId) {
        return (Array.isArray(rows) ? rows : []).map(function (r) { return mapMessageRow(r, meId); });
    }

    // Friendly inbox timestamp: time for today, date otherwise.
    function formatChatTime(value, nowMs) {
        if (!value) return '';
        const ms = Date.parse(value);
        if (Number.isNaN(ms)) return '';
        const then = new Date(ms);
        const now = new Date(typeof nowMs === 'number' ? nowMs : Date.now());
        const sameDay = then.getFullYear() === now.getFullYear()
            && then.getMonth() === now.getMonth()
            && then.getDate() === now.getDate();
        try {
            return sameDay
                ? then.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                : then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        } catch (_e) {
            return then.toISOString().slice(0, 10);
        }
    }

    // A message draft must be non-empty and within KC's 2000-char body cap.
    function validateMessageDraft(text) {
        const t = String(text || '').trim();
        if (!t) return { valid: false, error: 'Please write a message.' };
        if (t.length > 2000) return { valid: false, error: 'Messages are capped at 2000 characters.' };
        return { valid: true, error: '' };
    }

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

    return {
        mapChatRow: mapChatRow,
        inboxRows: inboxRows,
        attachPreviews: attachPreviews,
        attachUnread: attachUnread,
        buildFirstMessage: buildFirstMessage,
        mapMessageRow: mapMessageRow,
        mapMessageRows: mapMessageRows,
        formatChatTime: formatChatTime,
        validateMessageDraft: validateMessageDraft,
        dayLabelForIso: dayLabelForIso,
        groupMessagesWithDaySeparators: groupMessagesWithDaySeparators,
        createOptimisticMessage: createOptimisticMessage,
        reconcileOptimistic: reconcileOptimistic,
        markMessageFailed: markMessageFailed,
        shouldDedupeIncoming: shouldDedupeIncoming,
        patchInboxOnNewMessage: patchInboxOnNewMessage
    };
});
