import { describe, expect, it } from 'vitest';
import { buildProfileShareUrl } from '../buildProfileShareUrl';

describe('buildProfileShareUrl', () => {
  it('joins the base url and the handle', () => {
    expect(buildProfileShareUrl('u_abc123', 'https://karma-community-kc.com')).toBe(
      'https://karma-community-kc.com/user/u_abc123',
    );
  });

  it('strips trailing slashes from the base url', () => {
    expect(buildProfileShareUrl('rina', 'https://karma-community-kc.com//')).toBe(
      'https://karma-community-kc.com/user/rina',
    );
  });

  it('url-encodes the handle', () => {
    expect(buildProfileShareUrl('a b/c', 'https://kc.com')).toBe('https://kc.com/user/a%20b%2Fc');
  });

  it('throws on empty handle', () => {
    expect(() => buildProfileShareUrl('', 'https://kc.com')).toThrow(/handle/);
  });

  it('throws on empty base url', () => {
    expect(() => buildProfileShareUrl('rina', '')).toThrow(/webBaseUrl/);
  });
});
