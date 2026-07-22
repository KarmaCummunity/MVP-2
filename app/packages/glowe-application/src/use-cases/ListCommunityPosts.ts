import type { GloweListOrder } from '../ports/GloweListOrder';
import type {
  GlowePostRow,
  IGlowePostRepository,
} from '../ports/IGlowePostRepository';

export interface CommunityPost {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly text: string;
  readonly tags: readonly string[];
  readonly authorId: string;
  readonly authorName: string;
  readonly authorNameEn: string;
  readonly createdAt: string;
}

type CommunityPostRowInput = Partial<GlowePostRow> & {
  readonly id?: string;
  readonly user_id?: string;
  readonly post_type?: string | null;
  readonly status?: string;
};

export function isCommunityPost(row: CommunityPostRowInput | null | undefined): boolean {
  if (!row) return false;
  if (row.status === 'removed') return false;
  if (
    row.post_type === undefined
    || row.post_type === null
    || row.post_type === ''
  ) {
    return true;
  }
  return row.post_type === 'community';
}

export function mapPostRow(row: CommunityPostRowInput | null | undefined): CommunityPost {
  const source = row ?? {};
  return {
    id: source.id ?? '',
    title: source.title ?? '',
    category: source.category ?? '',
    text: source.text ?? '',
    tags: Array.isArray(source.tags) ? source.tags : [],
    authorId: source.user_id ?? '',
    authorName: source.author_name ?? 'Community Member',
    authorNameEn: source.author_name_en ?? '',
    createdAt: source.created_at ?? '',
  };
}

export function mapCommunityRows(
  rows: readonly CommunityPostRowInput[] | null | undefined,
): readonly CommunityPost[] {
  return (rows ?? []).filter(isCommunityPost).map(mapPostRow);
}

export interface ListCommunityPostsDeps {
  readonly posts: IGlowePostRepository;
}

export interface ListCommunityPostsInput {
  readonly order?: GloweListOrder;
}

export async function listCommunityPosts(
  deps: ListCommunityPostsDeps,
  input: ListCommunityPostsInput = {},
): Promise<readonly CommunityPost[]> {
  const rows = await deps.posts.listAll(input.order);
  return mapCommunityRows(rows ?? []);
}
