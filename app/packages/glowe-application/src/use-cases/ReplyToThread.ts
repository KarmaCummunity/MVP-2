import type {
  CreateForumReplyInput,
  GloweForumReplyRow,
  IGloweForumRepository,
} from '../ports/IGloweForumRepository';

export interface ReplyDraft {
  readonly threadId?: string;
  readonly thread_id?: string;
  readonly body?: string;
}

export interface ReplyValidationResult {
  readonly valid: boolean;
  readonly error: string;
}

export type ReplyToThreadResult =
  | { readonly ok: true; readonly reply: GloweForumReplyRow }
  | { readonly ok: false; readonly error: string };

export function validateReplyDraft(
  draft: ReplyDraft | null | undefined,
): ReplyValidationResult {
  const source = draft ?? {};
  const threadId = String(source.threadId ?? source.thread_id ?? '').trim();
  if (!threadId) {
    return { valid: false, error: 'Missing thread to reply to.' };
  }

  if (!String(source.body ?? '').trim()) {
    return { valid: false, error: 'Please write a reply.' };
  }

  return { valid: true, error: '' };
}

export function normalizeReplyDraft(
  draft: ReplyDraft | null | undefined,
): CreateForumReplyInput {
  const source = draft ?? {};
  return {
    thread_id: String(source.threadId ?? source.thread_id ?? '').trim(),
    body: String(source.body ?? '').trim(),
  };
}

export interface ReplyToThreadDeps {
  readonly forums: IGloweForumRepository;
}

export async function replyToThread(
  deps: ReplyToThreadDeps,
  draft: ReplyDraft,
): Promise<ReplyToThreadResult> {
  const validation = validateReplyDraft(draft);
  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  const reply = await deps.forums.createReply(normalizeReplyDraft(draft));
  if (!reply) {
    return { ok: false, error: 'Could not post reply.' };
  }

  return { ok: true, reply };
}
