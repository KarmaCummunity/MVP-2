import { describe, expect, it } from 'vitest';
import { SetRideTemplateStatusUseCase } from '../SetRideTemplateStatusUseCase';
import { FakeRideTemplateRepository } from './fakeRideTemplateRepository';

async function seedActive(repo: FakeRideTemplateRepository) {
  return repo.create({
    ownerId: 'u_owner',
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

describe('SetRideTemplateStatusUseCase', () => {
  it('transitions active → paused', async () => {
    const repo = new FakeRideTemplateRepository();
    const t = await seedActive(repo);
    const uc = new SetRideTemplateStatusUseCase(repo);
    const out = await uc.execute({ templateId: t.templateId, status: 'paused' });
    expect(out.status).toBe('paused');
  });

  it('transitions paused → active (resume)', async () => {
    const repo = new FakeRideTemplateRepository();
    const t = await seedActive(repo);
    await repo.setStatus(t.templateId, 'paused');
    const uc = new SetRideTemplateStatusUseCase(repo);

    const out = await uc.execute({ templateId: t.templateId, status: 'active' });
    expect(out.status).toBe('active');
  });

  it('transitions active → archived', async () => {
    const repo = new FakeRideTemplateRepository();
    const t = await seedActive(repo);
    const uc = new SetRideTemplateStatusUseCase(repo);
    const out = await uc.execute({ templateId: t.templateId, status: 'archived' });
    expect(out.status).toBe('archived');
  });

  it('is idempotent on a no-op transition', async () => {
    const repo = new FakeRideTemplateRepository();
    const t = await seedActive(repo);
    const uc = new SetRideTemplateStatusUseCase(repo);
    const out = await uc.execute({ templateId: t.templateId, status: 'active' });
    expect(out.status).toBe('active');
  });

  it('refuses archived → anything', async () => {
    const repo = new FakeRideTemplateRepository();
    const t = await seedActive(repo);
    await repo.setStatus(t.templateId, 'archived');
    const uc = new SetRideTemplateStatusUseCase(repo);
    await expect(
      uc.execute({ templateId: t.templateId, status: 'active' }),
    ).rejects.toMatchObject({ code: 'invalid_visibility' });
  });

  it('throws template_not_found when the row does not exist', async () => {
    const repo = new FakeRideTemplateRepository();
    const uc = new SetRideTemplateStatusUseCase(repo);
    await expect(
      uc.execute({ templateId: 'missing', status: 'paused' }),
    ).rejects.toMatchObject({ code: 'template_not_found' });
  });
});
