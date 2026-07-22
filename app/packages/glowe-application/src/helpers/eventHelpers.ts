import type { OpportunityViewModel } from './opportunityCatalog';

export type EventTiming = 'past' | 'ongoing' | 'upcoming';

export interface EventFilters {
  readonly type?: 'all' | 'physical' | 'digital';
  readonly timeframe?: 'all' | 'upcoming';
}

type EventLike = {
  readonly startAt?: string | null;
  readonly start_at?: string | null;
  readonly endAt?: string | null;
  readonly end_at?: string | null;
  readonly eventType?: string | null;
  readonly event_type?: string | null;
  readonly status?: string;
  readonly linkVisibility?: string;
  readonly link_visibility?: string;
  readonly linkRevealHours?: number | null;
  readonly link_reveal_hours?: number | null;
  readonly capacity?: number | null;
};

type RegistrationRef = {
  readonly opportunity_id?: string;
  readonly opportunityId?: string;
  readonly status?: string;
};

function toTime(value: string | Date | null | undefined): number {
  if (!value) return Number.NaN;
  const ms = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isNaN(ms) ? Number.NaN : ms;
}

export function isEvent(opp: EventLike | null | undefined): boolean {
  return Boolean(opp && (opp.startAt || opp.start_at));
}

export function startTime(opp: EventLike | null | undefined): number {
  return toTime(opp && (opp.startAt || opp.start_at));
}

export function endTime(opp: EventLike | null | undefined): number {
  return toTime(opp && (opp.endAt || opp.end_at));
}

export function eventTiming(
  opp: EventLike | null | undefined,
  nowMs?: number,
): EventTiming | null {
  if (!isEvent(opp)) return null;
  const now = typeof nowMs === 'number' ? nowMs : Date.now();
  const start = startTime(opp);
  const end = endTime(opp);
  if (Number.isNaN(start)) return null;
  if (!Number.isNaN(end)) {
    if (now < start) return 'upcoming';
    return now <= end ? 'ongoing' : 'past';
  }
  return now < start ? 'upcoming' : 'past';
}

export function isUpcoming(
  opp: EventLike | null | undefined,
  nowMs?: number,
): boolean {
  const timing = eventTiming(opp, nowMs);
  return timing === 'upcoming' || timing === 'ongoing';
}

export function filterEvents(
  list: readonly OpportunityViewModel[],
  filters: EventFilters | null | undefined,
  nowMs?: number,
): readonly OpportunityViewModel[] {
  const f = filters ?? {};
  return list.filter((opp) => {
    if (!isEvent(opp)) return false;
    const type = opp.eventType;
    if (f.type && f.type !== 'all' && type !== f.type) return false;
    if (f.timeframe === 'upcoming' && !isUpcoming(opp, nowMs)) return false;
    return true;
  });
}

export function sortByStart(
  list: readonly OpportunityViewModel[],
): readonly OpportunityViewModel[] {
  return list.slice().sort((a, b) => {
    const sa = startTime(a);
    const sb = startTime(b);
    if (Number.isNaN(sa)) return Number.isNaN(sb) ? 0 : 1;
    if (Number.isNaN(sb)) return -1;
    return sa - sb;
  });
}

export function findRegistration(
  registrations: readonly RegistrationRef[] | null | undefined,
  opportunityId: string | null | undefined,
): RegistrationRef | null {
  if (!opportunityId) return null;
  const list = registrations ?? [];
  for (let i = 0; i < list.length; i += 1) {
    const r = list[i];
    const oppId = r && (r.opportunity_id || r.opportunityId);
    if (oppId === opportunityId && isActiveRegistration(r?.status)) return r;
  }
  return null;
}

export function isActiveRegistration(status: string | undefined): boolean {
  return status === 'Accepted' || status === 'Pending' || status === 'Waitlisted';
}

export function isEventCancelled(event: EventLike | null | undefined): boolean {
  return Boolean(event && event.status === 'cancelled');
}

export function isDigital(event: EventLike | null | undefined): boolean {
  return Boolean(event && (event.eventType || event.event_type) === 'digital');
}

export function isEventOpenForRegistration(
  event: EventLike | null | undefined,
): boolean {
  if (!event) return false;
  if (isEventCancelled(event)) return false;
  const status = event.status ?? 'active';
  return status === 'active';
}
