import type {
  CreateForumThreadInput,
  GloweForumThreadRow,
  IGloweForumRepository,
} from '../ports/IGloweForumRepository';

export interface ThreadDraft {
  readonly groupId?: string;
  readonly group_id?: string;
  readonly title?: string;
  readonly body?: string;
}

export interface ThreadValidationResult {
  readonly valid: boolean;
  readonly error: string;
}

export type CreateThreadResult =
  | { readonly ok: true; readonly thread: GloweForumThreadRow }
  | { readonly ok: false; readonly error: string };

export function validateThreadDraft(
  draft: ThreadDraft | null | undefined,
): ThreadValidationResult {
  const source = draft ?? {};
  const groupId = String(source.groupId ?? source.group_id ?? '').trim();
  if (!groupId) {
    return { valid: false, error: 'Please choose a discussion group.' };
  }

  if (!String(source.title ?? '').trim()) {
    return { valid: false, error: 'Please add a thread title.' };
  }

  if (!String(source.body ?? '').trim()) {
    return { valid: false, error: 'Please write your question or topic.' };
  }

  return { valid: true, error: '' };
}

export function normalizeThreadDraft(
  draft: ThreadDraft | null | undefined,
): CreateForumThreadInput {
  const source = draft ?? {};
  return {
    group_id: String(source.groupId ?? source.group_id ?? '').trim(),
    title: String(source.title ?? '').trim(),
    body: String(source.body ?? '').trim(),
  };
}

export interface CreateThreadDeps {
  readonly forums: IGloweForumRepository;
}

export async function createThread(
  deps: CreateThreadDeps,
  draft: ThreadDraft,
): Promise<CreateThreadResult> {
  const validation = validateThreadDraft(draft);
  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  const thread = await deps.forums.createThread(normalizeThreadDraft(draft));
  if (!thread) {
    return { ok: false, error: 'Could not create thread.' };
  }

  return { ok: true, thread };
}
