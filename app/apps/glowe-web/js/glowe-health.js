// GloWe production health probe helpers (INFRA-QA-W7 / FR-GLOWE-018).
// Pure functions for the admin portal — no I/O.
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.GloweHealth = api;
}(typeof self !== 'undefined' ? self : this, function gloweHealthFactory() {
    const STATUS_ORDER = { fail: 0, degraded: 1, ok: 2 };

    function normalizeSummaryRow(row) {
        if (!row) return null;
        return {
            checkName: String(row.check_name || row.checkName || ''),
            status: String(row.status || 'fail'),
            latencyMs: row.latency_ms ?? row.latencyMs ?? null,
            errorDetail: row.error_detail || row.errorDetail || '',
            appVersion: row.app_version || row.appVersion || '',
            checkedAt: row.checked_at || row.checkedAt || null,
        };
    }

    function worstStatus(rows) {
        const list = (rows || []).map((r) => normalizeSummaryRow(r)).filter(Boolean);
        if (!list.length) return 'unknown';
        return list.reduce((worst, row) => (
            (STATUS_ORDER[row.status] ?? 99) < (STATUS_ORDER[worst] ?? 99) ? row.status : worst
        ), 'ok');
    }

    function statusLabel(status) {
        const map = {
            ok: 'Healthy',
            degraded: 'Degraded',
            fail: 'Failing',
            unknown: 'No data',
        };
        return map[status] || status;
    }

    function statusClass(status) {
        const map = {
            ok: 'health-ok',
            degraded: 'health-degraded',
            fail: 'health-fail',
            unknown: 'health-unknown',
        };
        return map[status] || 'health-unknown';
    }

    function formatLatency(ms) {
        if (ms === null || ms === undefined || Number.isNaN(Number(ms))) return '—';
        const n = Number(ms);
        if (n < 1000) return `${n}ms`;
        return `${(n / 1000).toFixed(1)}s`;
    }

    function formatCheckedAt(iso) {
        if (!iso) return '—';
        try {
            return new Date(iso).toLocaleString();
        } catch {
            return '—';
        }
    }

    function humanCheckName(checkName) {
        return String(checkName || '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    return {
        normalizeSummaryRow,
        worstStatus,
        statusLabel,
        statusClass,
        formatLatency,
        formatCheckedAt,
        humanCheckName,
    };
}));
