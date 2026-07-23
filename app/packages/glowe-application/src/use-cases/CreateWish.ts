import {
  buildWishText,
  validateWishDraft,
  type WishDraft,
} from '@kc/glowe-domain';

import type {
  CreatePostInput,
  GlowePostRow,
  IGlowePostRepository,
} from '../ports/IGlowePostRepository';

export interface CreateWishDraft extends WishDraft {
  readonly authorName?: string;
  readonly author_name?: string;
  readonly authorNameEn?: string;
  readonly author_name_en?: string | null;
}

export interface WishInsertPayload {
  readonly post_type: 'wish';
  readonly status: 'open';
  readonly title: string;
  readonly wish_type: string;
  readonly impact_area: string;
  readonly text: string;
  readonly author_name: string;
  readonly author_name_en: string | null;
}

export type CreateWishResult =
  | { readonly ok: true; readonly post: GlowePostRow }
  | { readonly ok: false; readonly error: string };

export function normalizeWishDraft(
  draft: CreateWishDraft | null | undefined,
): WishInsertPayload {
  const source = draft ?? {};
  const authorNameEn = source.author_name_en ?? source.authorNameEn ?? '';
  const trimmedAuthorNameEn = String(authorNameEn).trim();

  return {
    post_type: 'wish',
    status: 'open',
    title: String(source.title ?? '').trim(),
    wish_type: String(source.wish_type ?? '').trim(),
    impact_area: String(source.impact_area ?? '').trim(),
    text: buildWishText(source),
    author_name: String(source.author_name ?? source.authorName ?? '').trim(),
    author_name_en: trimmedAuthorNameEn || null,
  };
}

export interface CreateWishDeps {
  readonly posts: IGlowePostRepository;
}

export async function createWish(
  deps: CreateWishDeps,
  draft: CreateWishDraft,
): Promise<CreateWishResult> {
  const validation = validateWishDraft(draft);
  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  const payload = normalizeWishDraft(draft) as CreatePostInput;
  const post = await deps.posts.insert(payload);
  if (!post) {
    return { ok: false, error: 'Could not publish wish.' };
  }

  return { ok: true, post };
}
