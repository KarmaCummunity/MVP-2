import type { GloweFollowState } from '../ports/IGloweFollowGateway';

export type FollowButtonState =
  | 'self'
  | 'following'
  | 'not_following_public'
  | 'private_account'
  | 'unavailable';

export interface FollowButtonStateInfo {
  readonly state: FollowButtonState;
  readonly label: string;
  readonly showNote: boolean;
}

export type FollowErrorCode =
  | 'already_following'
  | 'blocked_relationship'
  | 'self_follow'
  | 'unknown';

export interface FollowErrorInfo {
  readonly code: FollowErrorCode;
  readonly message: string;
}

export interface FollowListGloweProfile {
  readonly id: string;
  readonly name: string;
  readonly avatarUrl: string;
}

export interface FollowListPublicUser {
  readonly user_id?: string;
  readonly display_name?: string | null;
  readonly avatar_url?: string | null;
}

export interface FollowConnectionRow {
  readonly userId: string;
  readonly name: string;
  readonly avatarUrl: string;
  readonly profileHref: string;
}

function buttonState(
  state: FollowButtonState,
  label = '',
  showNote = false,
): FollowButtonStateInfo {
  return { state, label, showNote: !!showNote };
}

function deriveFromTarget(target: NonNullable<GloweFollowState['target']>): FollowButtonStateInfo {
  if (String(target.accountStatus) !== 'active') return buttonState('unavailable');
  if (String(target.privacyMode) === 'Private') {
    return buttonState('private_account', '', true);
  }
  return buttonState('not_following_public', '+ Follow');
}

function deriveFromRaw(raw: GloweFollowState): FollowButtonStateInfo {
  const target = raw.target;
  if (!target) return buttonState('unavailable');
  if (raw.followingExists) return buttonState('following', 'Following ✓');
  return deriveFromTarget(target);
}

export function deriveButtonState(
  raw: GloweFollowState | null | undefined,
  viewerId: string,
  targetUserId: string,
): FollowButtonStateInfo {
  const me = String(viewerId || '');
  const target = String(targetUserId || '');
  if (!me || !target || me === target) return buttonState('self');
  return deriveFromRaw(raw ?? { target: null, followingExists: false });
}

export function connectionsPageUrl(
  userId: string,
  tab: 'followers' | 'following',
): string {
  const resolvedTab = tab === 'following' ? 'following' : 'followers';
  return (
    'connections.html?user=' +
    encodeURIComponent(String(userId || '')) +
    '&tab=' +
    resolvedTab
  );
}

function trimName(value: string | null | undefined): string {
  const text = value && String(value).trim();
  return text || '';
}

function pickDisplayName(
  gloweProfile: FollowListGloweProfile | null | undefined,
  publicUser: FollowListPublicUser | null | undefined,
): string {
  return trimName(gloweProfile?.name) || trimName(publicUser?.display_name) || 'GloWe member';
}

export function mapFollowListRow(
  publicUser: FollowListPublicUser | null | undefined,
  gloweProfile: FollowListGloweProfile | null | undefined,
): FollowConnectionRow {
  const embed = publicUser ?? {};
  const profile = gloweProfile ?? { id: '', name: '', avatarUrl: '' };
  const userId = String(profile.id || embed.user_id || '');
  return {
    userId,
    name: pickDisplayName(profile.id ? profile : null, embed),
    avatarUrl: profile.avatarUrl || embed.avatar_url || '',
    profileHref: 'profile.html?id=' + encodeURIComponent(userId),
  };
}

function errorText(err: { readonly message?: string; readonly details?: string }): string {
  return String(err.message || '') + ' ' + String(err.details || '');
}

export function isAlreadyFollowingError(
  err: { readonly code?: string; readonly message?: string; readonly details?: string } | null | undefined,
): boolean {
  const error = err ?? {};
  const text = errorText(error);
  if (error.code === '23505' && text.includes('follow_edges_pkey')) return true;
  return text.includes('already_following');
}

export function mapFollowError(
  err: { readonly code?: string; readonly message?: string; readonly details?: string } | null | undefined,
): FollowErrorInfo {
  const error = err ?? {};
  const text = errorText(error);
  if (isAlreadyFollowingError(error)) {
    return { code: 'already_following', message: '' };
  }
  if (text.includes('blocked_relationship') || error.code === '42501') {
    return { code: 'blocked_relationship', message: "Can't follow this profile" };
  }
  if (text.includes('self_follow')) {
    return { code: 'self_follow', message: "Can't follow this profile" };
  }
  return { code: 'unknown', message: 'Something went wrong' };
}
