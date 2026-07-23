import type {
  CreatePostInput,
  GlowePostRow,
  IGlowePostRepository,
} from '../ports/IGlowePostRepository';

export interface OutreachDraft {
  readonly recipientId?: string;
  readonly orgName?: string;
  readonly message?: string;
}

export interface OutreachValidationResult {
  readonly valid: boolean;
  readonly error: string;
}

export interface OutreachInsertPayload {
  readonly post_type: 'outreach';
  readonly category: 'outreach';
  readonly title: string;
  readonly text: string;
  readonly audience: string;
  readonly status: 'sent';
  readonly tags: readonly [];
}

export type SubmitOutreachResult =
  | { readonly ok: true; readonly post: GlowePostRow }
  | { readonly ok: false; readonly error: string };

export function validateOutreachDraft(
  input: OutreachDraft | null | undefined,
): OutreachValidationResult {
  const draft = input ?? {};
  if (!draft.recipientId) {
    return { valid: false, error: 'Missing recipient.' };
  }

  const message = String(draft.message ?? '').trim();
  if (message.length < 2) {
    return { valid: false, error: 'Please write a short message.' };
  }

  return { valid: true, error: '' };
}

export function buildOutreachPayload(
  input: OutreachDraft | null | undefined,
): OutreachInsertPayload {
  const draft = input ?? {};
  const orgName = String(draft.orgName ?? '').trim();

  return {
    post_type: 'outreach',
    category: 'outreach',
    title: orgName ? `Reach-out to ${orgName}` : 'Reach-out',
    text: String(draft.message ?? '').trim(),
    audience: String(draft.recipientId ?? ''),
    status: 'sent',
    tags: [],
  };
}

export interface SubmitOutreachDeps {
  readonly posts: IGlowePostRepository;
}

export async function submitOutreach(
  deps: SubmitOutreachDeps,
  draft: OutreachDraft,
): Promise<SubmitOutreachResult> {
  const validation = validateOutreachDraft(draft);
  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  const payload = buildOutreachPayload(draft) as CreatePostInput;
  const post = await deps.posts.insert(payload);
  if (!post) {
    return { ok: false, error: 'Could not send outreach.' };
  }

  return { ok: true, post };
}
