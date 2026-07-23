import type {
  CompleteOnboardingInput,
  GloweGoogleUser,
  GloweProfile,
  IGloweProfileRepository,
  ProfileEnglishNamePatch,
  UpsertProfileInput,
} from '@kc/glowe-application';
import type { SupabaseClient } from '@supabase/supabase-js';

import { tbl } from '../tbl';
import { buildOnboardingPayload } from '../mappers/onboardingPayload';
import { fromProfileRow, toProfileUpsertPayload } from '../mappers/profileRow';
import { resolveEnglishName } from './resolveEnglishName';

export class GloweProfileRepository implements IGloweProfileRepository {
  constructor(private readonly client: SupabaseClient) {}

  private async currentUserId(): Promise<string | null> {
    const { data } = await this.client.auth.getUser();
    return data.user?.id ?? null;
  }

  async getById(id: string): Promise<GloweProfile | null> {
    if (!id) return null;
    const { data, error } = await this.client
      .from(tbl('profiles'))
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return fromProfileRow(data);
  }

  async getMine(): Promise<GloweProfile | null> {
    const userId = await this.currentUserId();
    if (!userId) return null;
    return this.getById(userId);
  }

  async upsert(profile: UpsertProfileInput): Promise<GloweProfile | null> {
    const userId = await this.currentUserId();
    if (!userId) return null;
    const { data: auth } = await this.client.auth.getUser();
    const email = auth.user?.email ?? '';
    const payload = toProfileUpsertPayload({ ...profile, id: userId, email });
    const { data, error } = await this.client
      .from(tbl('profiles'))
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    return fromProfileRow(data);
  }

  async completeOnboarding(details: CompleteOnboardingInput): Promise<GloweProfile | null> {
    const { data: auth } = await this.client.auth.getUser();
    const user = auth.user;
    if (!user) return null;

    const isOrg = details.accountType === 'organization';
    const org = details.org ?? {};
    const displayName = details.displayName ?? '';
    const displayNameEn = await resolveEnglishName(
      this.client,
      displayName,
      details.displayNameEn,
      'person',
    );
    const orgName = isOrg ? (org.name ?? '') : null;
    const orgNameEn = isOrg
      ? await resolveEnglishName(this.client, orgName ?? '', org.nameEn, 'organization')
      : null;

    const payload = buildOnboardingPayload(user, details, {
      displayNameEn,
      orgNameEn,
    });

    const { data, error } = await this.client
      .from(tbl('profiles'))
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    return fromProfileRow(data);
  }

  async deleteMine(): Promise<boolean | null> {
    const userId = await this.currentUserId();
    if (!userId) return null;
    const { error } = await this.client.from(tbl('profiles')).delete().eq('id', userId);
    if (error) throw error;
    return true;
  }

  async uploadAvatar(file: Blob): Promise<string | null> {
    const userId = await this.currentUserId();
    if (!userId || !file) return null;
    const mime = 'type' in file ? String((file as Blob).type) : '';
    const extByMime: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const ext = extByMime[mime] || 'jpg';
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error } = await this.client.storage
      .from('glowe-avatars')
      .upload(path, file, { contentType: mime || 'image/jpeg', upsert: true });
    if (error) throw error;
    const { data } = this.client.storage.from('glowe-avatars').getPublicUrl(path);
    return data?.publicUrl ?? null;
  }

  async ensureFromGoogle(user: GloweGoogleUser): Promise<GloweProfile | null> {
    if (!user?.id) return null;
    const existing = await this.getMine().catch(() => null);
    if (existing) return existing;
    const meta = user.user_metadata ?? {};
    const displayName =
      meta.name ||
      meta.full_name ||
      (user.email ? user.email.split('@')[0] : 'GloWe member');
    const displayNameEn = await resolveEnglishName(this.client, displayName, '', 'person');
    const payload = {
      id: user.id,
      email: user.email || meta.email || '',
      display_name: displayName,
      display_name_en: displayNameEn || null,
      avatar_url: meta.avatar_url || meta.picture || '',
    };
    const { data, error } = await this.client
      .from(tbl('profiles'))
      .upsert(payload)
      .select()
      .maybeSingle();
    if (error) return null;
    return fromProfileRow(data);
  }

  async ensureEnglishNames(
    profileIds: readonly string[],
  ): Promise<readonly ProfileEnglishNamePatch[]> {
    const ids = profileIds.filter(Boolean).map(String);
    if (!ids.length) return [];
    try {
      const { data, error } = await this.client.functions.invoke('glowe-generate-name-en', {
        body: { profileIds: ids },
      });
      if (error) return [];
      const profiles =
        data && typeof data === 'object' && 'profiles' in data
          ? (data as { profiles?: ProfileEnglishNamePatch[] }).profiles
          : [];
      return Array.isArray(profiles) ? profiles : [];
    } catch {
      return [];
    }
  }

  async listApprovedOrgs(): Promise<readonly GloweProfile[] | null> {
    const { data, error } = await this.client
      .from(tbl('profiles'))
      .select('*')
      .eq('account_type', 'organization')
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => fromProfileRow(row)).filter((p): p is GloweProfile => p !== null);
  }

  async listMembers(): Promise<readonly GloweProfile[] | null> {
    const { data, error } = await this.client
      .from(tbl('profiles'))
      .select('*')
      .eq('account_type', 'individual')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => fromProfileRow(row)).filter((p): p is GloweProfile => p !== null);
  }
}
