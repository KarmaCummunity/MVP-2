import { describe, expect, it } from 'vitest';
import { CancelRideJoinUseCase } from '../CancelRideJoinUseCase';
import { FakeRideParticipantRepository } from './fakeRideParticipantRepository';

async function seedRequested(repo: FakeRideParticipantRepository) {
  repo.seedRide({
    rideId: 'r1',
    ownerId: 'u_owner',
    status: 'open',
    visibility: 'Public',
    seatsAvailable: 2,
  });
  repo.setCaller('u_rider');
  return repo.request({ rideId: 'r1', note: null });
}

describe('CancelRideJoinUseCase', () => {
  it('cancels a pending request', async () => {
    const repo = new FakeRideParticipantRepository();
    const row = await seedRequested(repo);
    const uc = new CancelRideJoinUseCase(repo);

    const out = await uc.execute({ participantId: row.participantId });

    expect(out.status).toBe('cancelled');
    expect(out.decidedAt).not.toBeNull();
  });

  it('cancels an approved seat', async () => {
    const repo = new FakeRideParticipantRepository();
    const row = await seedRequested(repo);
    repo.setCaller('u_owner');
    await repo.decide({ participantId: row.participantId, status: 'approved' });
    repo.setCaller('u_rider');

    const uc = new CancelRideJoinUseCase(repo);
    const out = await uc.execute({ participantId: row.participantId });

    expect(out.status).toBe('cancelled');
  });

  it('is idempotent on already-cancelled rows', async () => {
    const repo = new FakeRideParticipantRepository();
    const row = await seedRequested(repo);
    const uc = new CancelRideJoinUseCase(repo);
    const first = await uc.execute({ participantId: row.participantId });
    const second = await uc.execute({ participantId: row.participantId });

    expect(first.status).toBe('cancelled');
    expect(second.status).toBe('cancelled');
  });

  it('refuses to cancel a rejected row', async () => {
    const repo = new FakeRideParticipantRepository();
    const row = await seedRequested(repo);
    repo.setCaller('u_owner');
    await repo.decide({ participantId: row.participantId, status: 'rejected' });
    repo.setCaller('u_rider');

    const uc = new CancelRideJoinUseCase(repo);
    await expect(uc.execute({ participantId: row.participantId })).rejects.toMatchObject({
      code: 'cannot_cancel_rejected',
    });
  });

  it('refuses when caller is not the participant', async () => {
    const repo = new FakeRideParticipantRepository();
    const row = await seedRequested(repo);
    repo.setCaller('u_intruder');

    const uc = new CancelRideJoinUseCase(repo);
    await expect(uc.execute({ participantId: row.participantId })).rejects.toMatchObject({
      code: 'not_participant',
    });
  });
});
