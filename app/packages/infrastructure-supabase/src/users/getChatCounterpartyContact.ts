import type { SupabaseClient } from '@supabase/supabase-js';

/** FR-CHAT-014 AC7 — counterpart contact_phone for an active chat participant only. */
export async function getChatCounterpartyContact(
  client: SupabaseClient,
  chatId: string,
): Promise<string | null> {
  const { data, error } = await client.rpc('get_chat_counterparty_contact', {
    p_chat_id: chatId,
  });
  if (error) throw new Error(`get_chat_counterparty_contact: ${error.message}`);
  if (data == null) return null;
  const phone = String(data).trim();
  return phone.length > 0 ? phone : null;
}
