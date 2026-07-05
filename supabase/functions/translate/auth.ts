// supabase/functions/translate/auth.ts
// Server-side JWT verification via userClient.auth.getUser().
// The same user-scoped client is reused to RLS-check the source row (§9).

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

export interface AuthedUser {
  id: string;
  /** User-scoped client (carries the caller's JWT, RLS applies). */
  userClient: SupabaseClient;
}

export async function getAuthedUser(req: Request): Promise<AuthedUser | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user) return null;
  return { id: data.user.id, userClient };
}
