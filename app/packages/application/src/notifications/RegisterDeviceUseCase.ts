import { ValidationError, type Device, type DeviceRegistration } from '@kc/domain';
import type { IDeviceRepository } from './IDeviceRepository';

export class RegisterDeviceUseCase {
  constructor(private readonly deviceRepo: IDeviceRepository) {}

  async execute(input: DeviceRegistration): Promise<Device> {
    if (!input.userId) throw new ValidationError('userId is required', 'userId');
    if (!input.pushToken) throw new ValidationError('pushToken is required', 'pushToken');
    return this.deviceRepo.upsert(input);
  }
}
