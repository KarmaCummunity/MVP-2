import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAppEnvironment, isDevEnvironment, areGloweLinksEnabled } from '../environment';

describe('environment config', () => {
  const original = process.env['EXPO_PUBLIC_ENVIRONMENT'];

  beforeEach(() => {
    delete process.env['EXPO_PUBLIC_ENVIRONMENT'];
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env['EXPO_PUBLIC_ENVIRONMENT'];
    } else {
      process.env['EXPO_PUBLIC_ENVIRONMENT'] = original;
    }
  });

  it('reports development when env var is "development"', () => {
    process.env['EXPO_PUBLIC_ENVIRONMENT'] = 'development';
    expect(getAppEnvironment()).toBe('development');
    expect(isDevEnvironment()).toBe(true);
  });

  it('reports production when env var is "production"', () => {
    process.env['EXPO_PUBLIC_ENVIRONMENT'] = 'production';
    expect(getAppEnvironment()).toBe('production');
    expect(isDevEnvironment()).toBe(false);
  });

  it('defaults to production when env var is missing', () => {
    expect(getAppEnvironment()).toBe('production');
    expect(isDevEnvironment()).toBe(false);
  });

  it('treats unknown values as production (fail-safe)', () => {
    process.env['EXPO_PUBLIC_ENVIRONMENT'] = 'staging';
    expect(getAppEnvironment()).toBe('production');
    expect(isDevEnvironment()).toBe(false);
  });
});

describe('GLOWE links gating (areGloweLinksEnabled)', () => {
  const originalEnv = process.env['EXPO_PUBLIC_ENVIRONMENT'];
  const originalOverride = process.env['EXPO_PUBLIC_GLOWE_LINKS'];

  const restore = (key: string, value: string | undefined) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  };

  beforeEach(() => {
    delete process.env['EXPO_PUBLIC_ENVIRONMENT'];
    delete process.env['EXPO_PUBLIC_GLOWE_LINKS'];
  });

  afterEach(() => {
    restore('EXPO_PUBLIC_ENVIRONMENT', originalEnv);
    restore('EXPO_PUBLIC_GLOWE_LINKS', originalOverride);
  });

  it('is enabled in the development environment', () => {
    process.env['EXPO_PUBLIC_ENVIRONMENT'] = 'development';
    expect(areGloweLinksEnabled()).toBe(true);
  });

  it('is hidden in production', () => {
    process.env['EXPO_PUBLIC_ENVIRONMENT'] = 'production';
    expect(areGloweLinksEnabled()).toBe(false);
  });

  it('is hidden by default when the environment is unset (fail-safe to prod)', () => {
    expect(areGloweLinksEnabled()).toBe(false);
  });

  it('override "1" forces links on even in production', () => {
    process.env['EXPO_PUBLIC_ENVIRONMENT'] = 'production';
    process.env['EXPO_PUBLIC_GLOWE_LINKS'] = '1';
    expect(areGloweLinksEnabled()).toBe(true);
  });

  it('override "0" forces links off even in development', () => {
    process.env['EXPO_PUBLIC_ENVIRONMENT'] = 'development';
    process.env['EXPO_PUBLIC_GLOWE_LINKS'] = '0';
    expect(areGloweLinksEnabled()).toBe(false);
  });
});
