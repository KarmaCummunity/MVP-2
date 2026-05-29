// V2-ADMIN-CRM-8 — port for admin CRM contacts.
import type { CrmContactPage, CrmContactStatus } from '@kc/domain';

export interface CrmContactListFilters {
  readonly status?: CrmContactStatus;
  readonly query?: string;
  readonly tag?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface CrmContactUpsertInput {
  readonly contactId?: string | null;
  readonly name?: string;
  readonly organization?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly roleTitle?: string | null;
  readonly notes?: string | null;
  readonly tags?: readonly string[] | null;
  readonly status?: CrmContactStatus;
}

export interface ICrmContactsRepository {
  list(filters: CrmContactListFilters): Promise<CrmContactPage>;
  upsert(input: CrmContactUpsertInput): Promise<string>;
  delete(contactId: string): Promise<void>;
  markContacted(contactId: string): Promise<void>;
}
