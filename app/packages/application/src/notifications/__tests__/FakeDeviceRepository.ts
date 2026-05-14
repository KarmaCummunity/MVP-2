import type { Device, DeviceRegistration } from '@kc/domain';
import type { IDeviceRepository } from '../IDeviceRepository';

export class FakeDeviceRepository implements IDeviceRepository {
  rows: Device[] = [];

  async upsert(input: DeviceRegistration): Promise<Device> {
    const existingIndex = this.rows.findIndex((r) => r.pushToken === input.pushToken);
    const now = new Date().toISOString();

    if (existingIndex !== -1) {
      // Replace the row — userId and platform are readonly so we reconstruct
      const updated: Device = {
        deviceId: this.rows[existingIndex]!.deviceId,
        userId: input.userId,
        platform: input.platform,
        pushToken: input.pushToken,
        lastSeenAt: now,
        active: true,
      };
      this.rows[existingIndex] = updated;
      return updated;
    }

    const row: Device = {
      deviceId: `dev_${this.rows.length + 1}`,
      userId: input.userId,
      platform: input.platform,
      pushToken: input.pushToken,
      lastSeenAt: now,
      active: true,
    };
    this.rows.push(row);
    return row;
  }

  async deactivate(pushToken: string): Promise<void> {
    this.rows = this.rows.filter((r) => r.pushToken !== pushToken);
  }

  async listForUser(userId: string): Promise<Device[]> {
    return this.rows.filter((r) => r.userId === userId);
  }
}
