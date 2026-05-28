import { describe, expect, it } from 'vitest';
import { ListUserRideRequestsUseCase } from '../ListUserRideRequestsUseCase';
import { FakeRideParticipantRepository } from './fakeRideParticipantRepository';

describe('ListUserRideRequestsUseCase', () => {
  async function seedThreeForUser(repo: FakeRideParticipantRepository) {
    repo.seedRide({
      rideId: 'r1',
      ownerId: 'u_owner',
      status: 'open',
      visibility: 'Public',
      seatsAvailable: 3,
    });
    repo.seedRide({
      rideId: 'r2',
      ownerId: 'u_owner',
      status: 'open',
      visibility: 'Public',
      seatsAvailable: 3,
    });
    repo.seedRide({
      rideId: 'r3',
      ownerId: 'u_owner',
      status: 'open',
      visibility: 'Public',
      seatsAvailable: 3,
    });
    repo.setCaller('u_me');
    // Stagger requestedAt so ordering is deterministic.
    const a = await repo.request({ rideId: 'r1', note: null });
    await new Promise((r) => setTimeout(r, 2));
    const b = await repo.request({ rideId: 'r2', note: null });
    await new Promise((r) => setTimeout(r, 2));
    const c = await repo.request({ rideId: 'r3', note: null });
    return { a, b, c };
  }

  it('returns the caller rows, most recent first', async () => {
    const repo = new FakeRideParticipantRepository();
    const { c, b, a } = await seedThreeForUser(repo);

    const uc = new ListUserRideRequestsUseCase(repo);
    const out = await uc.execute({ userId: 'u_me' });

    expect(out.map((r) => r.participantId)).toEqual([c.participantId, b.participantId, a.participantId]);
  });

  it('honors a custom limit', async () => {
    const repo = new FakeRideParticipantRepository();
    await seedThreeForUser(repo);

    const uc = new ListUserRideRequestsUseCase(repo);
    const out = await uc.execute({ userId: 'u_me', limit: 2 });

    expect(out).toHaveLength(2);
  });

  it('does not leak other users rows', async () => {
    const repo = new FakeRideParticipantRepository();
    await seedThreeForUser(repo);
    repo.setCaller('u_other');
    repo.seedRide({
      rideId: 'r4',
      ownerId: 'u_owner',
      status: 'open',
      visibility: 'Public',
      seatsAvailable: 3,
    });
    await repo.request({ rideId: 'r4', note: null });

    const uc = new ListUserRideRequestsUseCase(repo);
    const mine = await uc.execute({ userId: 'u_me' });
    expect(mine.every((r) => r.userId === 'u_me')).toBe(true);
  });
});
