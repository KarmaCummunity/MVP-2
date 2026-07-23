import type {
  GloweReportPayload,
  GloweReportReason,
  GloweReportTargetType,
  SubmitReportDraft,
} from '../ports/IGloweModerationGateway';

export const REPORT_REASONS: ReadonlyArray<{
  readonly value: GloweReportReason;
  readonly label: string;
}> = [
  { value: 'spam', label: 'Spam or misleading promotion' },
  { value: 'harassment', label: 'Harassment or hate' },
  { value: 'misinformation', label: 'False or misleading information' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'fake_profile', label: 'Fake profile or impersonation' },
  { value: 'other', label: 'Other' },
];

const TARGET_TYPE_ALIASES: Record<string, GloweReportTargetType> = {
  post: 'post',
  wish: 'post',
  offer: 'post',
  opportunity: 'opportunity',
  event: 'opportunity',
  profile: 'profile',
  comment: 'comment',
  thread: 'thread',
  reply: 'reply',
  general: 'general',
};

export interface ReportDraftValidation {
  readonly valid: boolean;
  readonly error: string;
}

export function canonicalTargetType(type: string | null | undefined): GloweReportTargetType {
  return TARGET_TYPE_ALIASES[String(type || '').trim()] ?? 'general';
}

export function validateReportDraft(
  draft: SubmitReportDraft | null | undefined,
): ReportDraftValidation {
  const input = draft ?? {};
  const known = REPORT_REASONS.some((reason) => reason.value === input.reason);
  if (!known) return { valid: false, error: 'Please choose a reason.' };
  if (!input.targetId) return { valid: false, error: 'Missing report target.' };
  return { valid: true, error: '' };
}

export function buildReportPayload(
  draft: SubmitReportDraft | null | undefined,
): GloweReportPayload {
  const input = draft ?? {};
  const note = String(input.note ?? '').trim().slice(0, 2000);

  return {
    target_type: canonicalTargetType(input.targetType),
    target_id: String(input.targetId ?? ''),
    reason: input.reason ?? 'other',
    note: note || null,
  };
}

export function isDuplicateReportError(
  error: { readonly code?: string; readonly message?: string } | null | undefined,
): boolean {
  if (!error) return false;
  if (error.code === '23505') return true;
  return /duplicate key/i.test(String(error.message ?? ''));
}
