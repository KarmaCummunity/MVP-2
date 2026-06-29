import { describe, it, expect } from 'vitest';
import { createLanguageTag } from '../language';
import { ValidationError } from '../errors';

describe('createLanguageTag', () => {
  it('accepts and lowercases a plain language subtag', () => {
    expect(createLanguageTag('HE')).toBe('he');
    expect(createLanguageTag('en')).toBe('en');
  });

  it('normalizes script (Title) and region (UPPER) casing', () => {
    expect(createLanguageTag('zh-hant')).toBe('zh-Hant');
    expect(createLanguageTag('pt-br')).toBe('pt-BR');
    expect(createLanguageTag('ZH-HANT-hk')).toBe('zh-Hant-HK');
  });

  it('accepts a UN M.49 numeric region', () => {
    expect(createLanguageTag('es-419')).toBe('es-419');
  });

  it('trims surrounding whitespace', () => {
    expect(createLanguageTag('  fr-CA  ')).toBe('fr-CA');
  });

  it('throws ValidationError(field=languageTag) on empty input', () => {
    let captured: ValidationError | undefined;
    try { createLanguageTag(''); } catch (e) { captured = e as ValidationError; }
    expect(captured).toBeInstanceOf(ValidationError);
    expect(captured?.field).toBe('languageTag');
  });

  it('throws ValidationError on malformed tags', () => {
    expect(() => createLanguageTag('e')).toThrow(ValidationError);
    expect(() => createLanguageTag('english')).toThrow(ValidationError);
    expect(() => createLanguageTag('he_IL')).toThrow(ValidationError);
    expect(() => createLanguageTag('123')).toThrow(ValidationError);
  });
});
