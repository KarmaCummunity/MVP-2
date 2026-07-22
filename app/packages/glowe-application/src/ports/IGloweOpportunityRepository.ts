// FR-GLOWE-007 / FR-GLOWE-012 / FR-GLOWE-016 — opportunities, events, applications.

import type { GloweListOrder } from './GloweListOrder';

export type GloweEventType = 'digital' | 'physical' | string;

export type GloweRegistrationMode = 'open' | 'gated' | string;

export type GloweApplicationDecision = 'Accepted' | 'Declined' | string;

export type GloweRegistrationDecision = 'Accepted' | 'Declined' | string;

export interface GloweOpportunityRow {
  readonly id: string;
  readonly user_id?: string;
  readonly title: string;
  readonly organization: string;
  readonly organization_en: string | null;
  readonly org_icon: string;
  readonly location: string;
  readonly commitment: string;
  readonly duration: string;
  readonly field: string;
  readonly description: string;
  readonly skills: readonly string[];
  readonly requirements: string;
  readonly responsibilities: string;
  readonly featured: boolean;
  readonly start_at?: string | null;
  readonly end_at?: string | null;
  readonly event_type?: GloweEventType;
  readonly event_link?: string;
  readonly capacity?: number | null;
  readonly registration_mode?: GloweRegistrationMode;
  readonly status?: string;
  readonly created_at?: string;
}

export interface CreateOpportunityInput {
  readonly title?: string;
  readonly organization?: string;
  readonly organizationEn?: string;
  readonly organization_en?: string | null;
  readonly orgIcon?: string;
  readonly org_icon?: string;
  readonly location?: string;
  readonly commitment?: string;
  readonly duration?: string;
  readonly field?: string;
  readonly description?: string;
  readonly skills?: readonly string[];
  readonly requirements?: string;
  readonly responsibilities?: string;
  readonly featured?: boolean;
  readonly startAt?: string | null;
  readonly start_at?: string | null;
  readonly endAt?: string | null;
  readonly end_at?: string | null;
  readonly eventType?: GloweEventType;
  readonly event_type?: GloweEventType;
  readonly eventLink?: string;
  readonly event_link?: string;
  readonly capacity?: string | number | null;
  readonly registrationMode?: GloweRegistrationMode;
  readonly registration_mode?: GloweRegistrationMode;
}

export interface EventRegistrationContact {
  readonly email?: string;
  readonly phone?: string;
  readonly comment?: string;
}

export interface GloweApplicationRow {
  readonly id: string;
  readonly opportunity_id?: string;
  readonly user_id?: string;
  readonly status: string;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly comment?: string | null;
  readonly created_at?: string;
  readonly applicant_name?: string;
  readonly applicant_avatar?: string;
  readonly applicant_email?: string;
}

export interface GloweEventRegistrationRow {
  readonly id: string;
  readonly opportunity_id?: string;
  readonly user_id?: string;
  readonly status: string;
  readonly registrant_name?: string;
  readonly registrant_email?: string;
  readonly created_at?: string;
}

export interface IGloweOpportunityRepository {
  listAll(options?: GloweListOrder): Promise<readonly GloweOpportunityRow[] | null>;
  listMine(): Promise<readonly GloweOpportunityRow[] | null>;
  insert(payload: CreateOpportunityInput): Promise<GloweOpportunityRow | null>;
  update(id: string, patch: Partial<CreateOpportunityInput>): Promise<GloweOpportunityRow | null>;
  remove(filters: Record<string, string | number>): Promise<boolean | null>;
  registerForEvent(
    opportunityId: string,
    contact?: EventRegistrationContact,
  ): Promise<GloweApplicationRow | null>;
  cancelRegistration(registrationId: string): Promise<GloweApplicationRow | null>;
  listMyRegistrations(): Promise<readonly GloweApplicationRow[] | null>;
  listEventRegistrations(opportunityId: string): Promise<readonly GloweEventRegistrationRow[]>;
  listApplicationsForOpportunity(opportunityId: string): Promise<readonly GloweApplicationRow[]>;
  updateApplicationStatus(
    applicationId: string,
    decision: GloweApplicationDecision,
  ): Promise<GloweApplicationRow | null>;
  decideEventRegistration(
    registrationId: string,
    decision: GloweRegistrationDecision,
    note?: string,
  ): Promise<GloweEventRegistrationRow | null>;
  getEventLink(opportunityId: string): Promise<string | null>;
  cancelEvent(opportunityId: string): Promise<GloweOpportunityRow | null>;
}
