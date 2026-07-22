import { describe, it, expect } from 'vitest';
import GloweHealth from '../glowe-health.js';

describe('GloweHealth', () => {
    it('worstStatus picks fail over degraded over ok', () => {
        expect(GloweHealth.worstStatus([
            { check_name: 'a', status: 'ok' },
            { check_name: 'b', status: 'fail' },
            { check_name: 'c', status: 'degraded' },
        ])).toBe('fail');
    });

    it('worstStatus returns unknown for empty input', () => {
        expect(GloweHealth.worstStatus([])).toBe('unknown');
    });

    it('normalizeSummaryRow maps snake_case fields', () => {
        expect(GloweHealth.normalizeSummaryRow({
            check_name: 'home_load',
            status: 'ok',
            latency_ms: 120,
            checked_at: '2026-07-22T00:00:00.000Z',
        })).toEqual({
            checkName: 'home_load',
            status: 'ok',
            latencyMs: 120,
            errorDetail: '',
            appVersion: '',
            checkedAt: '2026-07-22T00:00:00.000Z',
        });
    });

    it('formatLatency renders ms and seconds', () => {
        expect(GloweHealth.formatLatency(250)).toBe('250ms');
        expect(GloweHealth.formatLatency(1500)).toBe('1.5s');
        expect(GloweHealth.formatLatency(null)).toBe('—');
    });

    it('humanCheckName title-cases slug', () => {
        expect(GloweHealth.humanCheckName('community_feed')).toBe('Community Feed');
    });
});
