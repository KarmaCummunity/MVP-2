import { describe, expect, it } from 'vitest';
import type { RideEmergencyEvent } from '../RideEmergencyEvent';

// FR-RIDE-035 — emergency event entity.
//
// RideEmergencyEvent is a compile-time-only interface (no runtime export),
// so these tests pin its documented shape via typed construction (verified
// by `tsc --noEmit`) and exercise the unresolved vs. resolved lifecycle plus
// nullable location fields. The `@ts-expect-error` cases assert the type
// system rejects malformed inputs.
describe('RideEmergencyEvent shape', () => {
  it('accepts an unresolved event with coordinates and a note (happy path)', () => {
    const event: RideEmergencyEvent = {
      eventId: 'evt-1',
      rideId: 'ride-1',
      triggeredBy: 'user-1',
      triggeredAt: '2026-05-31T10:00:00.000Z',
      lat: 32.0853,
      lng: 34.7818,
      note: 'תקלה ברכב',
      resolvedAt: null,
      resolvedBy: null,
    };
    expect(event.resolvedAt).toBeNull();
    expect(event.resolvedBy).toBeNull();
    expect(event.lat).toBeCloseTo(32.0853);
  });

  it('accepts a resolved event (boundary: resolution fields populated)', () => {
    const event: RideEmergencyEvent = {
      eventId: 'evt-2',
      rideId: 'ride-1',
      triggeredBy: 'user-1',
      triggeredAt: '2026-05-31T10:00:00.000Z',
      lat: 32.0853,
      lng: 34.7818,
      note: null,
      resolvedAt: '2026-05-31T10:15:00.000Z',
      resolvedBy: 'admin-9',
    };
    expect(event.resolvedAt).toBe('2026-05-31T10:15:00.000Z');
    expect(event.resolvedBy).toBe('admin-9');
  });

  it('accepts NULL location and note (boundary: minimal trigger payload)', () => {
    const event: RideEmergencyEvent = {
      eventId: 'evt-3',
      rideId: 'ride-1',
      triggeredBy: 'user-1',
      triggeredAt: '2026-05-31T10:00:00.000Z',
      lat: null,
      lng: null,
      note: null,
      resolvedAt: null,
      resolvedBy: null,
    };
    expect(event.lat).toBeNull();
    expect(event.lng).toBeNull();
  });

  it('rejects a non-numeric latitude at the type level', () => {
    const event: RideEmergencyEvent = {
      eventId: 'evt-4',
      rideId: 'ride-1',
      triggeredBy: 'user-1',
      triggeredAt: '2026-05-31T10:00:00.000Z',
      // @ts-expect-error — lat must be number | null, not string
      lat: '32.0853',
      lng: null,
      note: null,
      resolvedAt: null,
      resolvedBy: null,
    };
    expect(event).toBeDefined();
  });

  it('rejects a missing required field at the type level', () => {
    // @ts-expect-error — triggeredAt is required
    const event: RideEmergencyEvent = {
      eventId: 'evt-5',
      rideId: 'ride-1',
      triggeredBy: 'user-1',
      lat: null,
      lng: null,
      note: null,
      resolvedAt: null,
      resolvedBy: null,
    };
    expect(event).toBeDefined();
  });
});
