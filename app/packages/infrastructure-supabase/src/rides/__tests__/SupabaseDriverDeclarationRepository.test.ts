import { describe, expect, it, vi } from 'vitest';
import { RideError } from '@kc/domain';
import { SupabaseDriverDeclarationRepository } from '../SupabaseDriverDeclarationRepository';

type AnyClient = ConstructorParameters<typeof SupabaseDriverDeclarationRepository>[0];

const ROW = {
  user_id: 'u1',
  declared_at: '2026-06-01T00:00:00Z',
  license_declared: true,
  insurance_declared: true,
  no_profit_acknowledged: true,
} as const;

function authStub(userId: string | null) {
  return { getUser: async () => ({ data: { user: userId ? { id: userId } : null } }) };
}

describe('SupabaseDriverDeclarationRepository.getMine', () => {
  it('queries driver_declarations by user_id and maps the row', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: ROW, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { auth: authStub('u1'), from } as unknown as AnyClient;

    const repo = new SupabaseDriverDeclarationRepository(client);
    const out = await repo.getMine();

    expect(from).toHaveBeenCalledWith('driver_declarations');
    expect(select).toHaveBeenCalledWith('*');
    expect(eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(out).toEqual({
      userId: 'u1',
      declaredAt: '2026-06-01T00:00:00Z',
      licenseDeclared: true,
      insuranceDeclared: true,
      noProfitAcknowledged: true,
    });
  });

  it('returns null when no row matches', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { auth: authStub('u1'), from } as unknown as AnyClient;

    const repo = new SupabaseDriverDeclarationRepository(client);
    expect(await repo.getMine()).toBeNull();
  });

  it('throws RideError(auth_required) when not signed in', async () => {
    const from = vi.fn();
    const client = { auth: authStub(null), from } as unknown as AnyClient;

    const repo = new SupabaseDriverDeclarationRepository(client);
    await expect(repo.getMine()).rejects.toMatchObject({ code: 'auth_required' });
    await expect(repo.getMine()).rejects.toBeInstanceOf(RideError);
    expect(from).not.toHaveBeenCalled();
  });

  it('throws a generic Error on Supabase error', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'denied' } });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const client = { auth: authStub('u1'), from } as unknown as AnyClient;

    const repo = new SupabaseDriverDeclarationRepository(client);
    await expect(repo.getMine()).rejects.toThrow('denied');
  });
});

describe('SupabaseDriverDeclarationRepository.accept', () => {
  it('inserts a new declaration and maps the returned row when none exists', async () => {
    // getMine path → null, then insert path → ROW.
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const selectGet = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) });
    const single = vi.fn().mockResolvedValue({ data: ROW, error: null });
    const selectIns = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select: selectIns });
    const from = vi
      .fn()
      .mockReturnValueOnce({ select: selectGet }) // getMine
      .mockReturnValueOnce({ insert }); // insert
    const client = { auth: authStub('u1'), from } as unknown as AnyClient;

    const repo = new SupabaseDriverDeclarationRepository(client);
    const out = await repo.accept();

    expect(insert).toHaveBeenCalledWith({
      user_id: 'u1',
      license_declared: true,
      insurance_declared: true,
      no_profit_acknowledged: true,
    });
    expect(out.userId).toBe('u1');
    expect(out.licenseDeclared).toBe(true);
  });

  it('returns the existing declaration without inserting when one exists', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: ROW, error: null });
    const selectGet = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) });
    const insert = vi.fn();
    const from = vi.fn().mockReturnValue({ select: selectGet, insert });
    const client = { auth: authStub('u1'), from } as unknown as AnyClient;

    const repo = new SupabaseDriverDeclarationRepository(client);
    const out = await repo.accept();

    expect(insert).not.toHaveBeenCalled();
    expect(out.userId).toBe('u1');
  });

  it('throws RideError(auth_required) when not signed in', async () => {
    const client = { auth: authStub(null), from: vi.fn() } as unknown as AnyClient;
    const repo = new SupabaseDriverDeclarationRepository(client);
    await expect(repo.accept()).rejects.toMatchObject({ code: 'auth_required' });
  });

  it('throws a generic Error when the insert returns an error', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const selectGet = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) });
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'rls_denied' } });
    const selectIns = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select: selectIns });
    const from = vi
      .fn()
      .mockReturnValueOnce({ select: selectGet })
      .mockReturnValueOnce({ insert });
    const client = { auth: authStub('u1'), from } as unknown as AnyClient;

    const repo = new SupabaseDriverDeclarationRepository(client);
    await expect(repo.accept()).rejects.toThrow('rls_denied');
  });
});
