import {
  buildReportPayload,
  isDuplicateReportError,
  validateReportDraft,
} from '../helpers/moderationHelpers';
import type {
  GloweReportRow,
  IGloweModerationGateway,
  SubmitReportDraft,
} from '../ports/IGloweModerationGateway';

export interface SubmitReportDeps {
  readonly moderation: IGloweModerationGateway;
}

export type SubmitReportResult =
  | { readonly ok: true; readonly report: GloweReportRow; readonly alreadyReported?: false }
  | { readonly ok: true; readonly alreadyReported: true }
  | { readonly ok: false; readonly error: string };

export async function submitReport(
  deps: SubmitReportDeps,
  draft: SubmitReportDraft,
): Promise<SubmitReportResult> {
  const validation = validateReportDraft(draft);
  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  const payload = buildReportPayload(draft);

  try {
    const report = await deps.moderation.submitReport(payload);
    if (!report) {
      return { ok: false, error: 'Could not send report.' };
    }
    return { ok: true, report };
  } catch (err) {
    if (isDuplicateReportError(err as { code?: string; message?: string })) {
      return { ok: true, alreadyReported: true };
    }
    return { ok: false, error: 'Could not send report.' };
  }
}
