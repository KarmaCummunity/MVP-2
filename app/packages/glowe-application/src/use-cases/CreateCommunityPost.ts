import type {
  CreatePostInput,
  GlowePostRow,
  IGlowePostRepository,
} from '../ports/IGlowePostRepository';

export interface PostDraft {
  readonly title?: string;
  readonly category?: string;
  readonly text?: string;
  readonly body?: string;
  readonly tags?: string | readonly string[];
  readonly audience?: string;
  readonly language?: string;
  readonly link?: string;
  readonly authorName?: string;
  readonly author_name?: string;
  readonly authorNameEn?: string;
  readonly author_name_en?: string | null;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly error: string;
}

export interface CommunityPostInsertPayload {
  readonly post_type: 'community';
  readonly title: string;
  readonly category: string;
  readonly text: string;
  readonly tags: readonly string[];
  readonly audience: string;
  readonly language: string;
  readonly link: string;
  readonly author_name: string;
  readonly author_name_en: string | null;
}

export type CreateCommunityPostResult =
  | { readonly ok: true; readonly post: GlowePostRow }
  | { readonly ok: false; readonly error: string };

function commaList(value: string | readonly string[] | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  if (value === undefined || value === null) return [];
  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function validatePostDraft(
  draft: PostDraft | null | undefined,
): ValidationResult {
  const source = draft ?? {};
  if (!source.title || !String(source.title).trim()) {
    return { valid: false, error: 'Please add a post title.' };
  }

  const body = source.text !== undefined ? source.text : source.body;
  if (!body || !String(body).trim()) {
    return { valid: false, error: 'Please write something to share.' };
  }

  return { valid: true, error: '' };
}

export function normalizePostDraft(
  draft: PostDraft | null | undefined,
): CommunityPostInsertPayload {
  const source = draft ?? {};
  const body = source.text !== undefined ? source.text : source.body;
  const authorNameEn = source.author_name_en ?? source.authorNameEn ?? '';
  const trimmedAuthorNameEn = String(authorNameEn).trim();

  return {
    post_type: 'community',
    title: String(source.title ?? '').trim(),
    category: String(source.category ?? '').trim(),
    text: String(body ?? '').trim(),
    tags: commaList(source.tags),
    audience: String(source.audience ?? '').trim(),
    language: String(source.language ?? '').trim(),
    link: String(source.link ?? '').trim(),
    author_name: String(source.author_name ?? source.authorName ?? '').trim(),
    author_name_en: trimmedAuthorNameEn || null,
  };
}

export interface CreateCommunityPostDeps {
  readonly posts: IGlowePostRepository;
}

export async function createCommunityPost(
  deps: CreateCommunityPostDeps,
  draft: PostDraft,
): Promise<CreateCommunityPostResult> {
  const validation = validatePostDraft(draft);
  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  const payload = normalizePostDraft(draft) as CreatePostInput;
  const post = await deps.posts.insert(payload);
  if (!post) {
    return { ok: false, error: 'Could not publish post.' };
  }

  return { ok: true, post };
}
