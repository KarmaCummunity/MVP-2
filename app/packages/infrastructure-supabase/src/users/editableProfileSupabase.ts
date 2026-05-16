import type { SupabaseClient } from '@supabase/supabase-js';

export type EditableProfileDTO = {
  displayName: string | null;
  city: string | null;
  cityName: string | null;
  profileStreet: string | null;
  profileStreetNumber: string | null;
  biography: string | null;
  avatarUrl: string | null;
};

export async function supabaseGetEditableProfile(
  client: SupabaseClient,
  userId: string,
): Promise<EditableProfileDTO> {
  const { data, error } = await client
    .from('users')
    .select('display_name, city, city_name, profile_street, profile_street_number, biography, avatar_url')
    .eq('user_id', userId)
    .single();
  if (error) throw new Error(`getEditableProfile: ${error.message}`);
  if (!data) throw new Error('getEditableProfile: no row');
  const row = data as {
    display_name: string | null;
    city: string | null;
    city_name: string | null;
    profile_street: string | null;
    profile_street_number: string | null;
    biography: string | null;
    avatar_url: string | null;
  };
  return {
    displayName: row.display_name,
    city: row.city,
    cityName: row.city_name,
    profileStreet: row.profile_street,
    profileStreetNumber: row.profile_street_number,
    biography: row.biography,
    avatarUrl: row.avatar_url,
  };
}

export async function supabaseSetProfileAddressLines(
  client: SupabaseClient,
  userId: string,
  street: string | null,
  streetNumber: string | null,
): Promise<void> {
  const { error } = await client
    .from('users')
    .update({ profile_street: street, profile_street_number: streetNumber })
    .eq('user_id', userId);
  if (error) throw new Error(`setProfileAddressLines: ${error.message}`);
}

export type EditableProfilePatch = {
  displayName?: string;
  city?: string;
  cityName?: string;
  profileStreet?: string | null;
  profileStreetNumber?: string | null;
  biography?: string | null;
  avatarUrl?: string | null;
};

/** Audit §3.5 — single `UPDATE users SET ...` so a multi-column edit lands
 *  atomically. Caller passes only the fields it wants to change. */
export async function supabaseUpdateEditableProfile(
  client: SupabaseClient,
  userId: string,
  patch: EditableProfilePatch,
): Promise<void> {
  const row: Record<string, string | null> = {};
  if (patch.displayName !== undefined) row.display_name = patch.displayName;
  if (patch.city !== undefined) row.city = patch.city;
  if (patch.cityName !== undefined) row.city_name = patch.cityName;
  if (patch.profileStreet !== undefined) row.profile_street = patch.profileStreet;
  if (patch.profileStreetNumber !== undefined) row.profile_street_number = patch.profileStreetNumber;
  if (patch.biography !== undefined) row.biography = patch.biography;
  if (patch.avatarUrl !== undefined) row.avatar_url = patch.avatarUrl;
  if (Object.keys(row).length === 0) return; // empty patch — caller is expected to validate
  const { error } = await client.from('users').update(row).eq('user_id', userId);
  if (error) throw new Error(`updateEditableProfile: ${error.message}`);
}
