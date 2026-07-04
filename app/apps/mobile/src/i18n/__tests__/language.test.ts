// FR-SETTINGS-018 — app language helpers. Tests run under react-native-web
// (Platform.OS === 'web'), so the web branches of the direction/storage logic
// are exercised directly.
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_APP_LANGUAGE,
  applyLayoutDirection,
  getInitialLanguage,
  isRtlLanguage,
  isSupportedLanguage,
} from '../language';

describe('app language helpers (FR-SETTINGS-018)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('classifies reading direction: Hebrew is RTL, English is LTR', () => {
    expect(isRtlLanguage('he')).toBe(true);
    expect(isRtlLanguage('en')).toBe(false);
  });

  it('validates supported languages', () => {
    expect(isSupportedLanguage('he')).toBe(true);
    expect(isSupportedLanguage('en')).toBe(true);
    expect(isSupportedLanguage('fr')).toBe(false);
    expect(isSupportedLanguage(null)).toBe(false);
    expect(isSupportedLanguage(undefined)).toBe(false);
  });

  it('reads a persisted web preference and falls back to Hebrew', () => {
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
    });
    expect(getInitialLanguage()).toBe(DEFAULT_APP_LANGUAGE); // nothing stored → default
    store['kc.appLanguage'] = 'en';
    expect(getInitialLanguage()).toBe('en');
    store['kc.appLanguage'] = 'zz'; // invalid value
    expect(getInitialLanguage()).toBe('he');
  });

  it('applies the reading direction to the web document', () => {
    const documentElement = { dir: '', lang: '' };
    vi.stubGlobal('document', { documentElement });
    applyLayoutDirection('en');
    expect(documentElement.dir).toBe('ltr');
    expect(documentElement.lang).toBe('en');
    applyLayoutDirection('he');
    expect(documentElement.dir).toBe('rtl');
    expect(documentElement.lang).toBe('he');
  });
});
