// FR-GLOWE-015 — content reports (backend.js submitReport).

export type GloweReportReason =
  | 'spam'
  | 'harassment'
  | 'misinformation'
  | 'inappropriate_content'
  | 'fake_profile'
  | 'other';

export type GloweReportTargetType =
  | 'post'
  | 'opportunity'
  | 'profile'
  | 'comment'
  | 'thread'
  | 'reply'
  | 'general';

export interface GloweReportPayload {
  readonly target_type: GloweReportTargetType;
  readonly target_id: string;
  readonly reason: GloweReportReason;
  readonly note: string | null;
}

export interface GloweReportRow {
  readonly id: string;
  readonly reporter_id?: string;
  readonly target_type: GloweReportTargetType;
  readonly target_id: string;
  readonly reason: GloweReportReason;
  readonly note: string | null;
  readonly status?: string;
  readonly created_at?: string;
}

export interface SubmitReportDraft {
  readonly targetType?: string;
  readonly targetId?: string;
  readonly reason?: GloweReportReason;
  readonly note?: string;
}

export interface IGloweModerationGateway {
  submitReport(payload: GloweReportPayload): Promise<GloweReportRow | null>;
}
