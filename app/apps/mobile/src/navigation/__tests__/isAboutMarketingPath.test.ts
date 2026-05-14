import { describe, expect, it } from 'vitest';
import { isAboutMarketingPath } from '../aboutMarketingPaths';

describe('isAboutMarketingPath', () => {
  it('matches only marketing about routes', () => {
    expect(isAboutMarketingPath('/about')).toBe(true);
    expect(isAboutMarketingPath('/about-site')).toBe(true);
    expect(isAboutMarketingPath('/about-intro')).toBe(false);
    expect(isAboutMarketingPath('/feed')).toBe(false);
  });
});
