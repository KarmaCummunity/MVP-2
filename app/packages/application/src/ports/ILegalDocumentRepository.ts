import type {
  LegalDocType,
  LegalDocumentContent,
  LegalPendingItem,
} from '@kc/domain';

export interface AcceptLegalDocumentInput {
  readonly docType: LegalDocType;
  readonly version: number;
  readonly locale: string;
  readonly userAgent: string;
}

export interface AcceptLegalDocumentResult {
  readonly acceptanceId: string;
  readonly acceptedAt: Date;
}

export interface ILegalDocumentRepository {
  // Loads the current published version. Implementations should cache and
  // return cached content on network failure.
  getCurrentContent(docType: LegalDocType): Promise<LegalDocumentContent>;

  // Returns pending items for auth.uid(). Server uses the JWT's sub claim —
  // no client-side user id is passed.
  getPendingForCurrentUser(): Promise<LegalPendingItem[]>;

  // Logs an acceptance. Server validates version >= last_material_version.
  acceptVersion(input: AcceptLegalDocumentInput): Promise<AcceptLegalDocumentResult>;
}
