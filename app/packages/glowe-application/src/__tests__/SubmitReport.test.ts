import { describe, expect, it, vi } from 'vitest';

import type {
  GloweReportRow,
  IGloweModerationGateway,
  SubmitReportDraft,
} from '../ports/IGloweModerationGateway';
import { submitReport } from '../use-cases/SubmitReport';

function makeGateway(
  submitReportImpl: IGloweModerationGateway['submitReport'],
): IGloweModerationGateway {
  return { submitReport: submitReportImpl };
}

function makeReportRow(overrides: Partial<GloweReportRow> = {}): GloweReportRow {
  return {
    id: 'report-1',
    target_type: 'post',
    target_id: 'post-1',
    reason: 'spam',
    note: 'fishy',
    status: 'open',
    ...overrides,
  };
}

describe('submitReport', () => {
  it('validates, normalizes, and persists a report', async () => {
    const submit = vi.fn(async () => makeReportRow());
    const draft: SubmitReportDraft = {
      targetType: 'wish',
      targetId: '42',
      reason: 'spam',
      note: '  fishy  ',
    };

    const result = await submitReport({ moderation: makeGateway(submit) }, draft);

    expect(submit).toHaveBeenCalledWith({
      target_type: 'post',
      target_id: '42',
      reason: 'spam',
      note: 'fishy',
    });
    expect(result).toEqual({
      ok: true,
      report: makeReportRow(),
    });
  });

  it('returns a validation error without calling the gateway', async () => {
    const submit = vi.fn();
    const result = await submitReport(
      { moderation: makeGateway(submit) },
      { reason: 'spam' },
    );

    expect(submit).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: 'Missing report target.',
    });
  });

  it('treats a duplicate report as already reported', async () => {
    const submit = vi.fn(async () => {
      throw { code: '23505', message: 'duplicate key value violates unique constraint' };
    });

    const result = await submitReport(
      { moderation: makeGateway(submit) },
      { targetType: 'post', targetId: 'p1', reason: 'spam' },
    );

    expect(result).toEqual({ ok: true, alreadyReported: true });
  });

  it('returns an error when the gateway returns null', async () => {
    const result = await submitReport(
      { moderation: makeGateway(async () => null) },
      { targetType: 'post', targetId: 'p1', reason: 'spam' },
    );

    expect(result).toEqual({
      ok: false,
      error: 'Could not send report.',
    });
  });

  it('returns an error for unexpected gateway failures', async () => {
    const result = await submitReport(
      {
        moderation: makeGateway(async () => {
          throw { code: '42501', message: 'forbidden' };
        }),
      },
      { targetType: 'post', targetId: 'p1', reason: 'spam' },
    );

    expect(result).toEqual({
      ok: false,
      error: 'Could not send report.',
    });
  });
});
