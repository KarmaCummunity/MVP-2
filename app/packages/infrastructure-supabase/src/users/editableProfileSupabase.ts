import type { SupabaseClient } from '@supabase/supabase-js';

export type EditableProfileDTO = {
  displayName: string;
  city: string;
  cityName: string;
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
    display_name: string;
    city: string;
    city_name: string;
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
