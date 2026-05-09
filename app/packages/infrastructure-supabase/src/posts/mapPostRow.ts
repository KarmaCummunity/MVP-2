import type {
  Address,
  Category,
  ItemCondition,
  LocationDisplayLevel,
  MediaAsset,
  Post,
  PostStatus,
  PostType,
  PostVisibility,
} from '@kc/domain';
import type { PostWithOwner } from '@kc/application';
import type { Database } from '../database.types';

type PostRow = Database['public']['Tables']['posts']['Row'];
type MediaAssetRow = Database['public']['Tables']['media_assets']['Row'];
type RecipientRow = Database['public']['Tables']['recipients']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];

export interface PostJoinedRow extends PostRow {
  city_ref?: { name_he: string } | null;
  media_assets?: MediaAssetRow[] | null;
  recipient?: RecipientRow | null;
}

export interface PostWithOwnerJoinedRow extends PostJoinedRow {
  owner: Pick<
    UserRow,
    'user_id' | 'display_name' | 'avatar_url' | 'share_handle' | 'privacy_mode'
  > | null;
}

function mapMediaAsset(row: MediaAssetRow): MediaAsset {
  return {
    mediaAssetId: row.media_asset_id,
    postId: row.post_id,
    path: row.path,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}

function mapAddress(row: PostJoinedRow): Address {
  return {
    city: row.city,
    cityName: row.city_ref?.name_he ?? row.city,
    street: row.street,
    streetNumber: row.street_number,
  };
}

export function mapPostRow(row: PostJoinedRow): Post {
  const media = (row.media_assets ?? []).slice().sort((a, b) => a.ordinal - b.ordinal);
  return {
    postId: row.post_id,
    ownerId: row.owner_id,
    type: row.type as PostType,
    status: row.status as PostStatus,
    visibility: row.visibility as PostVisibility,
    title: row.title,
    description: row.description,
    category: row.category as Category,
    address: mapAddress(row),
    locationDisplayLevel: row.location_display_level as LocationDisplayLevel,
    itemCondition: (row.item_condition as ItemCondition | null) ?? null,
    urgency: row.urgency,
    mediaAssets: media.map(mapMediaAsset),
    recipient: row.recipient
      ? {
          postId: row.recipient.post_id,
          recipientUserId: row.recipient.recipient_user_id,
          markedAt: row.recipient.marked_at,
        }
      : null,
    reopenCount: row.reopen_count,
    deleteAfter: row.delete_after,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPostWithOwnerRow(row: PostWithOwnerJoinedRow): PostWithOwner {
  // Owner can be null when:
  // 1. The user_id was deleted from public.users (FK posts_owner_id_fkey is ON DELETE
  //    cascading, but if a row was orphaned through some other path the join returns null).
  // 2. RLS hides the owner row from the viewer (rare with current users RLS, but possible).
  // Per FR-CHAT-013 / R-MVP-Privacy-6 placeholder convention, surface a "משתמש שנמחק"
  // placeholder rather than throwing — one orphan post must not crash the feed.
  if (!row.owner) {
    return {
      ...mapPostRow(row),
      ownerName: 'משתמש שנמחק',
      ownerAvatarUrl: null,
      ownerHandle: '',
      ownerPrivacyMode: 'Public',
    };
  }
  return {
    ...mapPostRow(row),
    ownerName: row.owner.display_name,
    ownerAvatarUrl: row.owner.avatar_url,
    ownerHandle: row.owner.share_handle,
    ownerPrivacyMode: row.owner.privacy_mode as 'Public' | 'Private',
  };
}

export const POST_SELECT_OWNER = `
  *,
  city_ref:cities!posts_city_fkey(name_he),
  media_assets(*),
  recipient:recipients(*),
  owner:users!posts_owner_id_fkey(user_id, display_name, avatar_url, share_handle, privacy_mode)
`;

export const POST_SELECT_BARE = `
  *,
  city_ref:cities!posts_city_fkey(name_he),
  media_assets(*),
  recipient:recipients(*)
`;
