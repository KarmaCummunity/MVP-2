import type { IDeviceRepository } from './IDeviceRepository';

export class DeactivateDeviceUseCase {
  constructor(private readonly deviceRepo: IDeviceRepository) {}

  async execute(pushToken: string): Promise<void> {
    if (!pushToken) return;
    await this.deviceRepo.deactivate(pushToken);
  }
}
