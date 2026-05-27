process.env.EXPO_PUBLIC_SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://example.supabase.co';

import { describe, expect, it } from 'vitest';
import { getSupabasePublicImageUrl } from '../imageUrl';

describe('getSupabasePublicImageUrl', () => {
  it('routes through /object/public/ by default (transforms gated off)', () => {
    const url = getSupabasePublicImageUrl({ bucket: 'post-images', path: 'a/b.jpg', width: 400, quality: 80 });
    expect(url).toContain('/storage/v1/object/public/post-images/a/b.jpg');
    expect(url).not.toContain('?width');
    expect(url).not.toContain('/render/image/');
  });
  it('omits transform params via /object/public/ when none given', () => {
    const url = getSupabasePublicImageUrl({ bucket: 'avatars', path: 'x/y.jpg' });
    expect(url).toContain('/storage/v1/object/public/avatars/x/y.jpg');
    expect(url).not.toContain('?width');
  });
  it('returns empty string for empty path', () => {
    expect(getSupabasePublicImageUrl({ bucket: 'post-images', path: '' })).toBe('');
  });
});
