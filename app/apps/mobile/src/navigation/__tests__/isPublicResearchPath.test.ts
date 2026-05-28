import { describe, expect, it } from 'vitest';
import { isPublicResearchPath } from '../publicResearchPaths';

describe('isPublicResearchPath', () => {
  it('matches research runner and thanks routes', () => {
    expect(isPublicResearchPath('/research/alt-platforms-research')).toBe(true);
    expect(isPublicResearchPath('/research/thanks')).toBe(true);
    expect(isPublicResearchPath('/research')).toBe(true);
  });

  it('does not match unrelated routes', () => {
    expect(isPublicResearchPath('/about')).toBe(false);
    expect(isPublicResearchPath('/settings/surveys')).toBe(false);
  });
});
