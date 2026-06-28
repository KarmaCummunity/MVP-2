import { describe, expect, it } from 'vitest';
import { ListMyRideTemplatesUseCase } from '../ListMyRideTemplatesUseCase';
import { FakeRideTemplateRepository } from './fakeRideTemplateRepository';

async function seed(repo: FakeRideTemplateRepository, ownerId: string) {
  return repo.create({
    ownerId,
    mode: 'offer',
    originCityId: '5000',
    destCityId: '4000',
    originStreet: 'a',
    originStreetNumber: null,
    destStreet: 'b',
    destStreetNumber: null,
    departTime: '07:30',
    weekdayMask: 42,
    seatsAvailable: 3,
    description: null,
    visibility: 'Public',
    lookaheadDays: 7,
  });
}

describe('ListMyRideTemplatesUseCase', () => {
  it('returns only the caller rows, recent first', async () => {
    const repo = new FakeRideTemplateRepository();
    const a = await seed(repo, 'u_me');
    await new Promise((r) => setTimeout(r, 2));
    const b = await seed(repo, 'u_me');
    await seed(repo, 'u_other');

    const uc = new ListMyRideTemplatesUseCase(repo);
    const out = await uc.execute({ ownerId: 'u_me' });

    expect(out.map((r) => r.templateId)).toEqual([b.templateId, a.templateId]);
  });

  it('returns an empty array when no rows match', async () => {
    const repo = new FakeRideTemplateRepository();
    const uc = new ListMyRideTemplatesUseCase(repo);
    const out = await uc.execute({ ownerId: 'u_me' });
    expect(out).toEqual([]);
  });
});
