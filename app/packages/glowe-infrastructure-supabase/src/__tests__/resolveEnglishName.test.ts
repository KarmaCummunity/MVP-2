import { describe, expect, it } from 'vitest';

import { resolveEnglishName } from '../repositories/resolveEnglishName';
import { mockSupabaseClient } from './helpers/mockSupabaseClient';

describe('resolveEnglishName', () => {
  it('returns explicit English name when provided', async () => {
    const client = mockSupabaseClient();
    await expect(
      resolveEnglishName(client, 'נווה', 'Naveh', 'person'),
    ).resolves.toBe('Naveh');
  });

  it('returns latin primary without invoking edge function', async () => {
    const client = mockSupabaseClient();
    await expect(
      resolveEnglishName(client, 'Naveh', '', 'person'),
    ).resolves.toBe('Naveh');
    expect(client.functions.invoke).not.toHaveBeenCalled();
  });

  it('invokes edge function for non-latin names', async () => {
    const client = mockSupabaseClient({
      invokeResult: {
        data: { results: [{ textEn: 'Naveh' }] },
        error: null,
      },
    });
    await expect(
      resolveEnglishName(client, 'נווה', '', 'person'),
    ).resolves.toBe('Naveh');
    expect(client.functions.invoke).toHaveBeenCalled();
  });

  it('returns empty string on invoke error', async () => {
    const client = mockSupabaseClient({
      invokeResult: { data: null, error: new Error('fail') },
    });
    await expect(
      resolveEnglishName(client, 'נווה', '', 'organization'),
    ).resolves.toBe('');
  });
});
