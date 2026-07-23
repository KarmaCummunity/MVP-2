import type { IGloweChatGateway } from '../ports/IGloweChatGateway';

export interface GetOrCreateChatDeps {
  readonly chat: IGloweChatGateway;
}

export interface GetOrCreateChatInput {
  readonly viewerId: string;
  readonly otherUserId: string;
  readonly seedBody?: string;
}

export type GetOrCreateChatResult =
  | { readonly ok: true; readonly chatId: string }
  | { readonly ok: false; readonly error: string };

export async function getOrCreateChat(
  deps: GetOrCreateChatDeps,
  input: GetOrCreateChatInput,
): Promise<GetOrCreateChatResult> {
  const viewerId = String(input.viewerId || '');
  const otherUserId = String(input.otherUserId || '');

  if (!viewerId || !otherUserId) {
    return { ok: false, error: 'Missing member to message.' };
  }

  if (viewerId === otherUserId) {
    return { ok: false, error: 'You cannot message yourself.' };
  }

  const chat = await deps.chat.getOrCreateDmChat(otherUserId);
  if (!chat?.chat_id) {
    return { ok: false, error: 'Could not open conversation.' };
  }

  const seedBody = String(input.seedBody || '').trim();
  if (seedBody) {
    await deps.chat.sendMessage(chat.chat_id, seedBody).catch(() => null);
  }

  return { ok: true, chatId: chat.chat_id };
}
