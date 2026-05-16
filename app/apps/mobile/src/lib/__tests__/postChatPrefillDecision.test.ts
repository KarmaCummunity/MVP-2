import { describe, expect, it } from 'vitest';
import { firstParam, resolveDeferredPostPrefill } from '../postChatPrefillDecision';

describe('firstParam', () => {
  it('returns string as-is', () => {
    expect(firstParam('x')).toBe('x');
  });
  it('returns first array element', () => {
    expect(firstParam(['a', 'b'])).toBe('a');
  });
  it('returns undefined for undefined', () => {
    expect(firstParam(undefined)).toBeUndefined();
  });
});

describe('resolveDeferredPostPrefill', () => {
  const build = (title: string) => `T:${title}`;

  it('returns template when viewer never sent it', () => {
    expect(
      resolveDeferredPostPrefill({
        viewerId: 'u1',
        messages: [{ senderId: 'u2', body: 'hi' }],
        postTitle: 'Bike',
        buildTemplate: build,
      }),
    ).toBe('T:Bike');
  });

  it('returns null when viewer already sent exact template', () => {
    const template = build('Bike');
    expect(
      resolveDeferredPostPrefill({
        viewerId: 'u1',
        messages: [
          { senderId: 'u1', body: template },
          { senderId: 'u2', body: 'reply' },
        ],
        postTitle: 'Bike',
        buildTemplate: build,
      }),
    ).toBeNull();
  });
});
