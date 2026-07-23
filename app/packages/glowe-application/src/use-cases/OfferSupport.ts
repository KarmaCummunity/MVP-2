import {
  buildOfferText,
  validateOfferDraft,
  type OfferDraft,
} from '@kc/glowe-domain';

import type {
  CreateOfferInput,
  GloweOfferRow,
  IGlowePostRepository,
} from '../ports/IGlowePostRepository';

export interface OfferSupportDraft extends OfferDraft {
  readonly contact_preference?: string;
}

export interface OfferInsertPayload {
  readonly post_id: string;
  readonly offer_text: string;
  readonly availability: string;
  readonly contact_preference: string;
}

export type OfferSupportResult =
  | { readonly ok: true; readonly offer: GloweOfferRow }
  | { readonly ok: false; readonly error: string };

export function normalizeOfferDraft(
  postId: string,
  draft: OfferSupportDraft | null | undefined,
): OfferInsertPayload {
  const source = draft ?? {};
  const offerText = source.offer_text?.trim()
    ? String(source.offer_text).trim()
    : buildOfferText(source);

  return {
    post_id: postId,
    offer_text: offerText,
    availability: String(source.availability ?? '').trim(),
    contact_preference: String(source.contact_preference ?? 'In-app message').trim(),
  };
}

export interface OfferSupportDeps {
  readonly posts: IGlowePostRepository;
}

export interface OfferSupportInput {
  readonly postId: string;
  readonly draft: OfferSupportDraft;
}

export async function offerSupport(
  deps: OfferSupportDeps,
  input: OfferSupportInput,
): Promise<OfferSupportResult> {
  if (!input.postId?.trim()) {
    return { ok: false, error: 'Missing wish to support.' };
  }

  const draftWithText: OfferSupportDraft = {
    ...input.draft,
    offer_text: input.draft.offer_text?.trim()
      ? input.draft.offer_text
      : buildOfferText(input.draft),
  };

  const validation = validateOfferDraft(draftWithText);
  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  const payload = normalizeOfferDraft(input.postId, draftWithText) as CreateOfferInput;
  const offer = await deps.posts.insertOffer(payload);
  if (!offer) {
    return { ok: false, error: 'Could not send offer.' };
  }

  return { ok: true, offer };
}
