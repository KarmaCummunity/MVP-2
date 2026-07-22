// GloWe adaptive create system helpers (FR-GLOWE-016 AC3/AC4/AC7).
// Pure, DOM-free logic for the account-type-aware "+ Create" menu.

export type GloweAccountType = 'organization' | 'individual';

export type GloweCreateTypeId =
  | 'post'
  | 'event'
  | 'opportunity'
  | 'need'
  | 'offer';

export type GloweCreateSurface =
  | 'community'
  | 'opportunities'
  | 'wishes';

export interface GloweCreateType {
  readonly id: GloweCreateTypeId;
  readonly label: string;
  readonly description: string;
  readonly accountTypes: readonly GloweAccountType[];
  readonly surface: GloweCreateSurface;
}

export interface GloweProfileGate {
  accountType?: string;
  approvalStatus?: string;
}

export type CreateMenuViewerState = 'anon' | 'unverified' | 'ok';

export interface CreateMenuState {
  readonly state: CreateMenuViewerState;
  readonly types: readonly GloweCreateType[];
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly error: string;
}

export interface EventDraft {
  title?: string;
  organization?: string;
  organization_en?: string;
  organizationEn?: string;
  field?: string;
  location?: string;
  duration?: string;
  description?: string;
  start_at?: string;
  end_at?: string;
  event_type?: string;
  event_link?: string;
  capacity?: string | number | null;
  registration_mode?: string;
}

export interface NormalizedEventDraft {
  title: string;
  organization: string;
  organization_en: string | null;
  field: string;
  commitment: string;
  location: string;
  duration: string;
  description: string;
  skills: readonly string[];
  requirements: readonly string[];
  start_at: string | null;
  end_at: string | null;
  event_type: 'digital' | 'physical';
  event_link: string;
  capacity: number | null;
  registration_mode: 'open' | 'gated';
}

export interface OfferPostDraft {
  title?: string;
  text?: string;
  impact_area?: string | null;
  author_name?: string;
  authorName?: string;
  author_name_en?: string;
  authorNameEn?: string;
}

export interface NormalizedOfferPostDraft {
  post_type: 'offer';
  title: string;
  text: string;
  impact_area: string | null;
  category: 'offer';
  status: 'open';
  author_name: string;
  author_name_en: string | null;
}

export interface OfferPostRow {
  post_type?: string;
  postType?: string;
  status?: string;
}

// AC7 — modular type registry: adding a create type is one entry here.
export const GLOWE_CREATE_TYPES: readonly GloweCreateType[] = [
  {
    id: 'post',
    label: 'Post',
    description:
      'Share an update, a story, or knowledge with the community.',
    accountTypes: ['organization', 'individual'],
    surface: 'community',
  },
  {
    id: 'event',
    label: 'Event',
    description:
      'Publish a volunteering event with a date and registration.',
    accountTypes: ['organization'],
    surface: 'opportunities',
  },
  {
    id: 'opportunity',
    label: 'Volunteer Opportunity',
    description: 'Recruit volunteers for an ongoing role or project.',
    accountTypes: ['organization'],
    surface: 'opportunities',
  },
  {
    id: 'need',
    label: 'Need',
    description: 'Ask the community for help, resources, or partners.',
    accountTypes: ['organization', 'individual'],
    surface: 'wishes',
  },
  {
    id: 'offer',
    label: 'Volunteer Offer',
    description:
      'Offer your time and skills so organizations can find you.',
    accountTypes: ['individual'],
    surface: 'wishes',
  },
] as const;

// AC3 — compute the create-menu state for the current viewer.
export function createMenuState(
  loggedIn: boolean,
  profile: GloweProfileGate | null,
): CreateMenuState {
  if (!loggedIn) return { state: 'anon', types: [] };
  const p = profile ?? {};
  const accountType: GloweAccountType =
    p.accountType === 'organization' ? 'organization' : 'individual';
  if (
    accountType === 'organization' &&
    p.approvalStatus !== 'approved'
  ) {
    return { state: 'unverified', types: [] };
  }
  return {
    state: 'ok',
    types: GLOWE_CREATE_TYPES.filter((t) =>
      t.accountTypes.includes(accountType),
    ),
  };
}

export function findCreateType(id: string): GloweCreateType | null {
  return GLOWE_CREATE_TYPES.find((t) => t.id === id) ?? null;
}

function str(value: unknown): string {
  return String(value == null ? '' : value).trim();
}

function withDefault<T>(value: T | undefined | null, fallback: T): T {
  return value || fallback;
}

function toIso(value: string | undefined): string | null {
  return value ? new Date(value).toISOString() : null;
}

function isBlankCapacity(value: unknown): boolean {
  return value === undefined || value === null || String(value) === '';
}

function toCapacity(value: unknown): number | null {
  return isBlankCapacity(value) ? null : Number(value);
}

function capacityError(value: unknown): string {
  if (isBlankCapacity(value)) return '';
  const cap = Number(value);
  if (!Number.isInteger(cap) || cap <= 0) {
    return 'Capacity must be a positive number.';
  }
  return '';
}

function endTimeError(endAt: string, startMs: number): string {
  const end = Date.parse(endAt);
  if (Number.isNaN(end) || end < startMs) {
    return 'The end time must be after the start.';
  }
  return '';
}

function eventScheduleError(d: EventDraft): string {
  if (!d.start_at) return 'Please choose a start date and time.';
  const start = Date.parse(d.start_at);
  if (Number.isNaN(start)) return 'Please choose a valid start date.';
  return d.end_at ? endTimeError(d.end_at, start) : '';
}

function eventDraftError(d: EventDraft): string {
  if (!str(d.title)) return 'Please add an event title.';
  return eventScheduleError(d) || capacityError(d.capacity);
}

// AC4 — event draft validation.
export function validateEventDraft(draft: EventDraft | null | undefined): ValidationResult {
  const error = eventDraftError(draft ?? {});
  return error ? { valid: false, error } : { valid: true, error: '' };
}

// AC4 — normalize an event draft into the glowe_opportunities insert shape.
export function normalizeEventDraft(
  draft: EventDraft | null | undefined,
): NormalizedEventDraft {
  const d = draft ?? {};
  return {
    title: str(d.title),
    organization: str(d.organization),
    organization_en: str(d.organization_en ?? d.organizationEn) || null,
    field: withDefault(d.field, 'Community'),
    commitment: 'Event',
    location: str(d.location),
    duration: str(d.duration),
    description: str(d.description),
    skills: [],
    requirements: [],
    start_at: toIso(d.start_at),
    end_at: toIso(d.end_at),
    event_type: d.event_type === 'digital' ? 'digital' : 'physical',
    event_link: str(d.event_link),
    capacity: toCapacity(d.capacity),
    registration_mode: d.registration_mode === 'open' ? 'open' : 'gated',
  };
}

// AC4 — volunteer-offer draft validation.
export function validateOfferPostDraft(
  draft: OfferPostDraft | null | undefined,
): ValidationResult {
  const d = draft ?? {};
  if (!d.title || !String(d.title).trim()) {
    return {
      valid: false,
      error: 'Please add a short headline for your offer.',
    };
  }
  if (!d.text || !String(d.text).trim()) {
    return { valid: false, error: 'Please describe what you can offer.' };
  }
  return { valid: true, error: '' };
}

// AC4 — normalize a volunteer-offer draft into the glowe_posts insert shape.
export function normalizeOfferPostDraft(
  draft: OfferPostDraft | null | undefined,
): NormalizedOfferPostDraft {
  const d = draft ?? {};
  return {
    post_type: 'offer',
    title: String(d.title ?? '').trim(),
    text: String(d.text ?? '').trim(),
    impact_area: d.impact_area ?? null,
    category: 'offer',
    status: 'open',
    author_name: String(d.author_name ?? d.authorName ?? '').trim(),
    author_name_en:
      String(d.author_name_en ?? d.authorNameEn ?? '').trim() || null,
  };
}

// A glowe_posts row is a live volunteer offer (Wishing Well "Offers" rail).
export function isOpenOffer(row: OfferPostRow | null | undefined): boolean {
  if (!row) return false;
  const type = row.post_type !== undefined ? row.post_type : row.postType;
  const status = row.status;
  return type === 'offer' && status === 'open';
}
