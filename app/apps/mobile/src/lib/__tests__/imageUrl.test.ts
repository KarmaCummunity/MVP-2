process.env.EXPO_PUBLIC_SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://example.supabase.co';

import { describe, expect, it } from 'vitest';
import { getSupabasePublicImageUrl } from '../imageUrl';

describe('getSupabasePublicImageUrl', () => {
  it('appends width + quality params via /render/image/', () => {
    const url = getSupabasePublicImageUrl({ bucket: 'post-images', path: 'a/b.jpg', width: 400, quality: 80 });
    expect(url).toContain('/storage/v1/render/image/public/post-images/a/b.jpg');
    expect(url).toContain('width=400');
    expect(url).toContain('quality=80');
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
