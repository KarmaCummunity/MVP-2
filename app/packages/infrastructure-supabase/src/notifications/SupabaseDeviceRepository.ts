// ─────────────────────────────────────────────
// SupabaseDeviceRepository — adapter for IDeviceRepository.
// Mapped to spec: FR-NOTIF-015.
// ─────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Device, DeviceRegistration } from '@kc/domain';
import type { IDeviceRepository } from '@kc/application';
import type { Database } from '../database.types';

type DeviceRow = Database['public']['Tables']['devices']['Row'];

function mapRow(row: DeviceRow): Device {
  return {
    deviceId: row.device_id,
    userId: row.user_id,
    pushToken: row.push_token,
    platform: row.platform as 'ios' | 'android' | 'web',
    lastSeenAt: row.last_seen_at,
    active: row.active,
  };
}

export class SupabaseDeviceRepository implements IDeviceRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async upsert(input: DeviceRegistration): Promise<Device> {
    const { data, error } = await this.client
      .from('devices')
      .upsert(
        {
          user_id: input.userId,
          push_token: input.pushToken,
          platform: input.platform,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'push_token' },
      )
      .select('*')
      .single();
    if (error) throw error;
    return mapRow(data);
  }

  async deactivate(pushToken: string): Promise<void> {
    const { error } = await this.client
      .from('devices')
      .delete()
      .eq('push_token', pushToken);
    if (error && error.code !== 'PGRST116') throw error;
  }

  async listForUser(userId: string): Promise<Device[]> {
    const { data, error } = await this.client
      .from('devices')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return (data ?? []).map(mapRow);
  }
}
