import { describe, expect, it, vi } from 'vitest';
import { FinanceAccountError } from '@kc/domain';
import { ListFinanceAccountsUseCase } from '../ListFinanceAccountsUseCase';
import { UpsertFinanceAccountUseCase } from '../UpsertFinanceAccountUseCase';
import type { IFinanceAccountsRepository } from '../IFinanceAccountsRepository';

function makeRepo(): IFinanceAccountsRepository & {
  list: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
} {
  return {
    list: vi.fn(async () => []),
    upsert: vi.fn(async () => 'acc-1'),
  } as never;
}

describe('ListFinanceAccountsUseCase', () => {
  it('forwards filters to the repository', async () => {
    const repo = makeRepo();
    await new ListFinanceAccountsUseCase(repo).execute({ type: 'income', activeOnly: false });
    expect(repo.list).toHaveBeenCalledWith({ type: 'income', activeOnly: false });
  });

  it('defaults to an empty filter', async () => {
    const repo = makeRepo();
    await new ListFinanceAccountsUseCase(repo).execute();
    expect(repo.list).toHaveBeenCalledWith({});
  });
});

describe('UpsertFinanceAccountUseCase', () => {
  it('rejects blank code or name without calling the repo', async () => {
    const repo = makeRepo();
    const uc = new UpsertFinanceAccountUseCase(repo);
    await expect(uc.execute({ code: '  ', name: 'x', type: 'income' }))
      .rejects.toBeInstanceOf(FinanceAccountError);
    await expect(uc.execute({ code: '4000', name: '', type: 'income' }))
      .rejects.toBeInstanceOf(FinanceAccountError);
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('passes a valid account through and returns the id', async () => {
    const repo = makeRepo();
    const id = await new UpsertFinanceAccountUseCase(repo).execute({
      code: '4000', name: 'תרומות', type: 'income',
    });
    expect(id).toBe('acc-1');
    expect(repo.upsert).toHaveBeenCalledOnce();
  });
});
