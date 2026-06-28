export type LegalDocType = 'terms' | 'privacy';
export type LegalSeverity = 'minor' | 'standard' | 'critical';
export type LegalBlockMode = 'banner' | 'modal';

export interface LegalDocument {
  readonly docType: LegalDocType;
  readonly currentVersion: number;
  readonly currentEffectiveDate: Date;
  readonly lastMaterialVersion: number;
  readonly lastMaterialSeverity: LegalSeverity | null;
}

export interface LegalDocumentContent {
  readonly docType: LegalDocType;
  readonly version: number;
  readonly effectiveDate: Date;
  readonly bodyMd: string;
  readonly contentHash: string;
  readonly severity: LegalSeverity;
  readonly changeSummary: string | null;
  readonly publishedAt: Date;
}

export interface LegalPendingItem {
  readonly docType: LegalDocType;
  readonly currentVersion: number;
  readonly currentEffectiveDate: Date;
  readonly lastAcceptedVersion: number;
  readonly severity: LegalSeverity;
  readonly blockMode: LegalBlockMode;
}

// Server (needs_legal_reacknowledgement) is the source of truth for blockMode;
// the client never derives it from local time.
export function shouldBlockImmediately(pending: LegalPendingItem[]): boolean {
  return pending.some((p) => p.blockMode === 'modal');
}
