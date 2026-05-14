import { describe, it, expect } from 'vitest';
import { RegisterDeviceUseCase } from '../RegisterDeviceUseCase';
import { FakeDeviceRepository } from './FakeDeviceRepository';
import { ValidationError } from '@kc/domain';

describe('RegisterDeviceUseCase', () => {
  it('upserts a fresh token for a user', async () => {
    const repo = new FakeDeviceRepository();
    const uc = new RegisterDeviceUseCase(repo);

    await uc.execute({ userId: 'u1', pushToken: 'ExponentPushToken[abc]', platform: 'ios' });

    expect(repo.rows).toHaveLength(1);
    expect(repo.rows[0]!.userId).toBe('u1');
    expect(repo.rows[0]!.pushToken).toBe('ExponentPushToken[abc]');
  });

  it('reassigns a token to a different user', async () => {
    const repo = new FakeDeviceRepository();
    const uc = new RegisterDeviceUseCase(repo);

    await uc.execute({ userId: 'u1', pushToken: 'ExponentPushToken[abc]', platform: 'ios' });
    await uc.execute({ userId: 'u2', pushToken: 'ExponentPushToken[abc]', platform: 'ios' });

    expect(repo.rows).toHaveLength(1);
    expect(repo.rows[0]!.userId).toBe('u2');
  });

  it('rejects empty userId with ValidationError', async () => {
    const repo = new FakeDeviceRepository();
    const uc = new RegisterDeviceUseCase(repo);

    await expect(
      uc.execute({ userId: '', pushToken: 'ExponentPushToken[abc]', platform: 'ios' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects empty pushToken with ValidationError', async () => {
    const repo = new FakeDeviceRepository();
    const uc = new RegisterDeviceUseCase(repo);

    await expect(
      uc.execute({ userId: 'u1', pushToken: '', platform: 'ios' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
