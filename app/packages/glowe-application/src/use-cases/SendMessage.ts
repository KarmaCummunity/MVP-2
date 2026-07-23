import { validateMessageDraft } from '../helpers/messageHelpers';
import type { GloweMessageRow, IGloweChatGateway } from '../ports/IGloweChatGateway';

export interface SendMessageDeps {
  readonly chat: IGloweChatGateway;
}

export interface SendMessageInput {
  readonly chatId: string;
  readonly body: string;
}

export type SendMessageResult =
  | { readonly ok: true; readonly message: GloweMessageRow }
  | { readonly ok: false; readonly error: string };

export async function sendMessage(
  deps: SendMessageDeps,
  input: SendMessageInput,
): Promise<SendMessageResult> {
  const chatId = String(input.chatId || '');
  if (!chatId) {
    return { ok: false, error: 'Missing conversation.' };
  }

  const validation = validateMessageDraft(input.body);
  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  const message = await deps.chat.sendMessage(chatId, String(input.body).trim());
  if (!message) {
    return { ok: false, error: 'Could not send message.' };
  }

  return { ok: true, message };
}
