// FR-GLOWE-003 / FR-GLOWE-015 — admin RPCs (backend.js admin* block).

import type { GloweProfile } from './IGloweProfileRepository';
import type { GloweReportTargetType } from './IGloweModerationGateway';

export interface GloweAdminCounts {
  readonly members: number;
  readonly orgs: number;
}

export interface GloweAdminReportRow {
  readonly id: string;
  readonly reporter_name?: string;
  readonly target_type: GloweReportTargetType | string;
  readonly target_id: string;
  readonly reason: string;
  readonly note: string | null;
  readonly status: string;
  readonly created_at?: string;
}

export interface GloweHealthSummaryRow {
  readonly check_name: string;
  readonly status: string;
  readonly detail?: string;
  readonly checked_at?: string;
}

export interface GloweHealthCheckRow {
  readonly id: string;
  readonly check_name: string;
  readonly status: string;
  readonly detail?: string;
  readonly created_at?: string;
}

export type OrgApprovalDecision = 'approved' | 'rejected' | string;

export interface IGloweAdminGateway {
  isGloweAdmin(): Promise<boolean>;
  fetchCounts(): Promise<GloweAdminCounts>;
  listPendingOrgs(): Promise<readonly GloweProfile[] | null>;
  setOrgApproval(
    profileId: string,
    decision: OrgApprovalDecision,
    note?: string,
  ): Promise<GloweProfile | null>;
  listReports(): Promise<readonly GloweAdminReportRow[]>;
  dismissReport(reportId: string): Promise<GloweAdminReportRow | null>;
  removeContent(
    targetType: string,
    targetId: string,
    reportId?: string | null,
  ): Promise<boolean | null>;
  healthSummary(): Promise<readonly GloweHealthSummaryRow[]>;
  listHealthChecks(limit?: number): Promise<readonly GloweHealthCheckRow[]>;
}
