import { describe, it, expect } from 'vitest';
import { DonationLinkError } from '../errors';

describe('DonationLinkError', () => {
  it('is an Error subclass with name="DonationLinkError", carries code/message/cause', () => {
    const cause = new Error('inner');
    const err = new DonationLinkError('invalid_url', 'Bad URL', cause);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(DonationLinkError);
    expect(err.name).toBe('DonationLinkError');
    expect(err.code).toBe('invalid_url');
    expect(err.message).toBe('Bad URL');
    expect(err.cause).toBe(cause);
  });

  it('cause defaults to undefined', () => {
    expect(new DonationLinkError('unreachable', 'x').cause).toBeUndefined();
  });

  it('setPrototypeOf preserves instanceof across transpilation', () => {
    const err = new DonationLinkError('rate_limited', 'x');
    expect(err instanceof DonationLinkError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });

  it('preserves every code in the DonationLinkErrorCode union', () => {
    for (const code of [
      'invalid_input', 'invalid_url', 'unreachable', 'rate_limited',
      'unauthorized', 'forbidden', 'network', 'unknown',
    ] as const) {
      expect(new DonationLinkError(code, code).code).toBe(code);
    }
  });
});
