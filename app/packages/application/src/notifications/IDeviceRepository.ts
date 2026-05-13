import type { Device, DeviceRegistration } from '@kc/domain';

export interface IDeviceRepository {
  /**
   * Insert or update a device row keyed by push_token.
   * If the token already exists with a different userId, the row is reassigned to the new user.
   * Updates last_seen_at to now() on every call.
   */
  upsert(input: DeviceRegistration): Promise<Device>;

  /**
   * Soft-deactivate a device by removing its row from `devices`.
   * No-op if the token is not registered.
   */
  deactivate(pushToken: string): Promise<void>;

  /**
   * List all active device rows for a user.
   * Used by sign-out flow and for diagnostics in Settings → device-status section.
   */
  listForUser(userId: string): Promise<Device[]>;
}
