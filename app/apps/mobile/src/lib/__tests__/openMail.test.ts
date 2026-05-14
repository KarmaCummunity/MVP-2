import { describe, it, expect } from 'vitest';
import { resolveWebmailUrl } from '../openMail';

describe('resolveWebmailUrl', () => {
  it('routes gmail addresses to gmail.com', () => {
    expect(resolveWebmailUrl('alice@gmail.com')).toBe('https://mail.google.com/mail/u/0/#inbox');
  });

  it('routes googlemail.com to gmail.com', () => {
    expect(resolveWebmailUrl('alice@googlemail.com')).toBe('https://mail.google.com/mail/u/0/#inbox');
  });

  it('routes outlook / hotmail / live to outlook.live.com', () => {
    expect(resolveWebmailUrl('bob@outlook.com')).toBe('https://outlook.live.com/mail/');
    expect(resolveWebmailUrl('bob@hotmail.com')).toBe('https://outlook.live.com/mail/');
    expect(resolveWebmailUrl('bob@live.com')).toBe('https://outlook.live.com/mail/');
  });

  it('routes yahoo to mail.yahoo.com', () => {
    expect(resolveWebmailUrl('eve@yahoo.com')).toBe('https://mail.yahoo.com/');
  });

  it('falls back to mailto: for unknown providers', () => {
    expect(resolveWebmailUrl('user@example.com')).toBe('mailto:');
  });

  it('returns mailto: for malformed email', () => {
    expect(resolveWebmailUrl('no-at')).toBe('mailto:');
    expect(resolveWebmailUrl('')).toBe('mailto:');
  });

  it('is case-insensitive on the domain', () => {
    expect(resolveWebmailUrl('A@GMAIL.COM')).toBe('https://mail.google.com/mail/u/0/#inbox');
  });
});
