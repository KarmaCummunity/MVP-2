import { isTranslatable, needsTranslation } from '@kc/domain';
import type { PostWithOwner } from '../ports/IPostRepository';
import type { TranslatablePostField } from './PostTranslationsUseCases';

/**
 * Derive the translatable fields of a post for a reader language. A field is
 * eligible when it has natural-language text and its source language differs
 * from (or is unknown vs) the reader language. Pure; no I/O.
 */
export function toTranslatableFields(
  post: Pick<PostWithOwner, 'postId' | 'title' | 'description' | 'sourceLanguage'>,
  readerLanguage: string,
): TranslatablePostField[] {
  if (!needsTranslation(post.sourceLanguage, readerLanguage)) return [];
  const candidates: { field: 'title' | 'description'; text: string | null }[] = [
    { field: 'title', text: post.title },
    { field: 'description', text: post.description },
  ];
  return candidates
    .filter((c) => typeof c.text === 'string' && isTranslatable(c.text))
    .map((c) => ({
      postId: post.postId,
      field: c.field,
      sourceLanguage: post.sourceLanguage,
      text: c.text as string,
    }));
}
