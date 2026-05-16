import { describe, it, expect, vi, beforeEach } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Capture the AppState listener so we can drive state transitions manually.
let appStateListener:
  | ((state: 'active' | 'background' | 'inactive') => void)
  | null = null;
const setBadgeSpy = vi.fn();

vi.mock('react-native', async () => {
  const actual = await vi.importActual<any>('react-native');
  return {
    ...actual,
    AppState: {
      addEventListener: (event: string, handler: any) => {
        if (event === 'change') appStateListener = handler;
        return { remove: () => undefined };
      },
    },
  };
});

vi.mock('expo-notifications', () => ({
  setBadgeCountAsync: (n: number) => {
    setBadgeSpy(n);
    return Promise.resolve();
  },
}));

import { installBadgeAutoClear } from '../badge';

beforeEach(() => {
  setBadgeSpy.mockClear();
});

describe('installBadgeAutoClear', () => {
  it('registers an AppState "change" listener on first install', () => {
    installBadgeAutoClear();
    expect(appStateListener).toBeTypeOf('function');
  });

  it('clears the badge to 0 when the app returns to "active"', () => {
    installBadgeAutoClear();
    appStateListener!('active');
    expect(setBadgeSpy).toHaveBeenCalledTimes(1);
    expect(setBadgeSpy).toHaveBeenCalledWith(0);
  });

  it('does not touch the badge on "background" or "inactive" states', () => {
    installBadgeAutoClear();
    appStateListener!('background');
    appStateListener!('inactive');
    expect(setBadgeSpy).not.toHaveBeenCalled();
  });

  it('clears on every active transition (multiple foregrounds fire multiple clears)', () => {
    installBadgeAutoClear();
    appStateListener!('active');
    appStateListener!('background');
    appStateListener!('active');
    appStateListener!('active');
    expect(setBadgeSpy).toHaveBeenCalledTimes(3);
    expect(setBadgeSpy.mock.calls.every(([n]) => n === 0)).toBe(true);
  });

  it('install is idempotent — repeat calls do not re-register the listener', () => {
    installBadgeAutoClear();
    const first = appStateListener;
    installBadgeAutoClear();
    installBadgeAutoClear();
    // Module-scoped `installed` guard prevents double-register; the listener
    // captured on first install is still the only one.
    expect(appStateListener).toBe(first);
  });
});
