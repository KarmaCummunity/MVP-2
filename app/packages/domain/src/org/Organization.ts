// FR-ORG-001..004 — domain types for the multi-tenant organization root.

export const ORGANIZATION_STATUSES = ['active', 'suspended', 'trial'] as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export function parseOrganizationStatus(
  value: string | null | undefined,
): OrganizationStatus | null {
  if (value == null) return null;
  return (ORGANIZATION_STATUSES as readonly string[]).includes(value)
    ? (value as OrganizationStatus)
    : null;
}

/** An organization the current user belongs to, with their membership flag. */
export interface Organization {
  readonly id: string;
  readonly slug: string;
  readonly displayName: string;
  readonly legalName: string | null;
  readonly status: OrganizationStatus;
  readonly isDefault: boolean;
  readonly logoUrl: string | null;
  readonly primaryColor: string | null;
  readonly accentColor: string | null;
  readonly currency: string;
  readonly locale: string;
}

export type OrganizationErrorCode =
  | 'forbidden'
  | 'not_found'
  | 'not_a_member'
  | 'unknown';

export class OrganizationError extends Error {
  constructor(public readonly code: OrganizationErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'OrganizationError';
  }
}

export function isOrganizationError(value: unknown): value is OrganizationError {
  return value instanceof OrganizationError;
}
