// V2-ADMIN-CRM-8 — admin CRM contact entity + error type.

export const CRM_CONTACT_STATUSES = ['cold', 'warm', 'active', 'inactive'] as const;
export type CrmContactStatus = (typeof CRM_CONTACT_STATUSES)[number];

export function parseCrmContactStatus(value: string | null | undefined): CrmContactStatus | null {
  if (value == null) return null;
  return (CRM_CONTACT_STATUSES as readonly string[]).includes(value)
    ? (value as CrmContactStatus)
    : null;
}

export interface CrmContact {
  readonly contactId: string;
  readonly name: string;
  readonly organization: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly roleTitle: string | null;
  readonly notes: string | null;
  readonly tags: readonly string[];
  readonly status: CrmContactStatus;
  readonly lastContactedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CrmContactPage {
  readonly rows: readonly CrmContact[];
  readonly totalCount: number;
}

export type CrmContactErrorCode =
  | 'forbidden'
  | 'invalid_name'
  | 'invalid_status'
  | 'contact_not_found'
  | 'unknown';

export class CrmContactError extends Error {
  constructor(public readonly code: CrmContactErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'CrmContactError';
  }
}

export function isCrmContactError(value: unknown): value is CrmContactError {
  return value instanceof CrmContactError;
}
