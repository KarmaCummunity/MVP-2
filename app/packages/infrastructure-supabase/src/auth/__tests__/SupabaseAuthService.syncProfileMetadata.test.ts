import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseAuthService } from '../SupabaseAuthService';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('SupabaseAuthService — syncProfileMetadata', () => {
  it('writes full_name, name, avatar_url, and picture via auth.updateUser', async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const client = { auth: { updateUser } } as unknown as SupabaseClient<any>;

    await new SupabaseAuthService(client).syncProfileMetadata({
      displayName: 'נווה',
      avatarUrl: 'https://example.com/a.jpg',
    });

    expect(updateUser).toHaveBeenCalledWith({
      data: {
        full_name: 'נווה',
        name: 'נווה',
        avatar_url: 'https://example.com/a.jpg',
        picture: 'https://example.com/a.jpg',
      },
    });
  });

  it('allows clearing avatar with null', async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const client = { auth: { updateUser } } as unknown as SupabaseClient<any>;

    await new SupabaseAuthService(client).syncProfileMetadata({ avatarUrl: null });

    expect(updateUser).toHaveBeenCalledWith({
      data: { avatar_url: null, picture: null },
    });
  });
});
