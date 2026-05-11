import type { SupabaseClient } from '@supabase/supabase-js';
import type { OnboardingBootstrap } from '@kc/application';
import type { OnboardingState } from '@kc/domain';

export async function supabaseGetOnboardingBootstrap(
  client: SupabaseClient,
  userId: string,
): Promise<OnboardingBootstrap> {
  const { data, error } = await client
    .from('users')
    .select('onboarding_state, basic_info_skipped')
    .eq('user_id', userId)
    .single();
  if (error) throw new Error(`getOnboardingBootstrap: ${error.message}`);
  const row = data as {
    onboarding_state: OnboardingState;
    basic_info_skipped: boolean;
  } | null;
  const state = row?.onboarding_state;
  if (!state) throw new Error('getOnboardingBootstrap: no row');
  return { state, basicInfoSkipped: row.basic_info_skipped === true };
}

export async function supabaseMarkBasicInfoSkipped(
  client: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await client.from('users').update({ basic_info_skipped: true }).eq('user_id', userId);
  if (error) throw new Error(`markBasicInfoSkipped: ${error.message}`);
}

export async function supabaseClearBasicInfoSkipped(
  client: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await client.from('users').update({ basic_info_skipped: false }).eq('user_id', userId);
  if (error) throw new Error(`clearBasicInfoSkipped: ${error.message}`);
}

export async function supabaseSetBasicInfo(
  client: SupabaseClient,
  userId: string,
  params: { displayName: string; city: string; cityName: string },
): Promise<void> {
  const { error } = await client
    .from('users')
    .update({
      display_name: params.displayName,
      city: params.city,
      city_name: params.cityName,
      basic_info_skipped: false,
    })
    .eq('user_id', userId);
  if (error) throw new Error(`setBasicInfo: ${error.message}`);
}
