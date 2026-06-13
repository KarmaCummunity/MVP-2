import { describe, expect, it } from 'vitest';
import {
  CRM_CONTACT_STATUSES,
  CrmContactError,
  isCrmContactError,
  parseCrmContactStatus,
} from '../CrmContact';

describe('parseCrmContactStatus', () => {
  it.each(CRM_CONTACT_STATUSES)('accepts the canonical status "%s"', (s) => {
    expect(parseCrmContactStatus(s)).toBe(s);
  });

  it('rejects an unknown status', () => {
    expect(parseCrmContactStatus('limbo')).toBeNull();
  });

  it('returns null for nullish input', () => {
    expect(parseCrmContactStatus(null)).toBeNull();
    expect(parseCrmContactStatus(undefined)).toBeNull();
  });
});

describe('CrmContactError', () => {
  it('carries the code and an explicit message when given', () => {
    const e = new CrmContactError('forbidden', 'no perm');
    expect(e.code).toBe('forbidden');
    expect(e.message).toBe('no perm');
    expect(e.name).toBe('CrmContactError');
  });

  it('falls back to the code when no message is given', () => {
    expect(new CrmContactError('contact_not_found').message).toBe('contact_not_found');
  });
});

describe('isCrmContactError', () => {
  it('narrows CrmContactError instances', () => {
    expect(isCrmContactError(new CrmContactError('unknown'))).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isCrmContactError(new Error('plain'))).toBe(false);
    expect(isCrmContactError(null)).toBe(false);
    expect(isCrmContactError({ code: 'forbidden' })).toBe(false);
  });
});
