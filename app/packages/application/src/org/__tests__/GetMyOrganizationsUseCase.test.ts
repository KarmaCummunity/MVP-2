import { describe, expect, it, vi } from 'vitest';
import type { Organization } from '@kc/domain';
import { GetMyOrganizationsUseCase } from '../GetMyOrganizationsUseCase';
import type { IOrganizationRepository } from '../IOrganizationRepository';

const org: Organization = {
  id: 'o1',
  slug: 'karma-community',
  displayName: 'קהילת קארמה',
  legalName: 'Karma Community',
  status: 'active',
  isDefault: true,
  logoUrl: null,
  primaryColor: null,
  accentColor: null,
  currency: 'ILS',
  locale: 'he',
};

describe('GetMyOrganizationsUseCase', () => {
  it('delegates to the repository and returns its rows', async () => {
    const repo: IOrganizationRepository = { listMine: vi.fn(async () => [org]) };
    const uc = new GetMyOrganizationsUseCase(repo);
    await expect(uc.execute()).resolves.toEqual([org]);
    expect(repo.listMine).toHaveBeenCalledOnce();
  });

  it('passes through an empty membership list', async () => {
    const repo: IOrganizationRepository = { listMine: vi.fn(async () => []) };
    const uc = new GetMyOrganizationsUseCase(repo);
    await expect(uc.execute()).resolves.toEqual([]);
  });
});
