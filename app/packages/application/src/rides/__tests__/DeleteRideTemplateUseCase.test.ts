import { describe, expect, it } from 'vitest';
import { DeleteRideTemplateUseCase } from '../DeleteRideTemplateUseCase';
import { FakeRideTemplateRepository } from './fakeRideTemplateRepository';

describe('DeleteRideTemplateUseCase', () => {
  it('removes the template from the repo', async () => {
    const repo = new FakeRideTemplateRepository();
    const t = await repo.create({
      ownerId: 'u_o',
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

    const uc = new DeleteRideTemplateUseCase(repo);
    await uc.execute({ templateId: t.templateId });

    expect(repo.rows).toHaveLength(0);
    expect(repo.deletedIds).toContain(t.templateId);
  });

  it('throws template_not_found when the row does not exist', async () => {
    const repo = new FakeRideTemplateRepository();
    const uc = new DeleteRideTemplateUseCase(repo);
    await expect(uc.execute({ templateId: 'missing' })).rejects.toMatchObject({
      code: 'template_not_found',
    });
  });
});
