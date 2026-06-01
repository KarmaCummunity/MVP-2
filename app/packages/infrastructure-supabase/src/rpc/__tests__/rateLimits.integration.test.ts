// NFR-SEC-009 — messages (10/s) and reports (5/h) rate limits (TD-162).

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createIntegrationClient } from '../../__tests__/integrationSupabaseClient';
import {
  type TestHarness,
  seedChatBetween,
  seedUser,
  signInAs,
} from '../../admin/__tests__/hardeningRpc.helpers';

const URL = process.env['SUPABASE_URL'] ?? process.env['EXPO_PUBLIC_SUPABASE_URL'];
const ANON = process.env['SUPABASE_ANON_KEY'] ?? process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'];
const SERVICE = process.env['SUPABASE_SERVICE_ROLE_KEY'];

const skip = !URL || !ANON || !SERVICE;
const d = skip ? describe.skip : describe;

d('rate limits — messages and reports (Wave 1)', () => {
  let h: TestHarness;

  beforeAll(() => {
    h = {
      url: URL!,
      anon: ANON!,
      admin: createIntegrationClient(URL!, SERVICE!),
      cleanup: [],
    };
  });

  afterAll(async () => {
    for (const fn of (h?.cleanup ?? []).reverse()) await fn();
  });

  it('blocks the 11th user message within one second', async () => {
    const senderUid = await seedUser(h);
    const otherUid = await seedUser(h);
    const chatId = await seedChatBetween(h, senderUid, otherUid);
    const client = await signInAs(h, senderUid);

    let lastError: { message?: string; code?: string } | null = null;
    for (let i = 0; i < 11; i += 1) {
      const { error } = await client.from('messages').insert({
        chat_id: chatId,
        sender_id: senderUid,
        kind: 'user',
        body: `rate-limit-probe-${i}`,
        status: 'pending',
      });
      if (error) lastError = error;
      else lastError = null;
    }

    expect(lastError).not.toBeNull();
    expect(lastError?.message ?? '').toMatch(/rate_limit_exceeded/i);
  });

  it('blocks the 6th report within one hour', async () => {
    const reporterUid = await seedUser(h);
    const client = await signInAs(h, reporterUid);

    let lastError: { message?: string; code?: string } | null = null;
    for (let i = 0; i < 6; i += 1) {
      const { error } = await client.from('reports').insert({
        reporter_id: reporterUid,
        target_type: 'none',
        target_id: null,
        reason: 'Other',
      });
      if (error) lastError = error;
      else lastError = null;
    }

    expect(lastError).not.toBeNull();
    expect(lastError?.message ?? '').toMatch(/rate_limit_exceeded/i);
  });
});
