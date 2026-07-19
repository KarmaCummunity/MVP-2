import { describe, expect, it } from 'vitest';
import { isTabActive, resolveActiveTabKey, TABS } from '../tabs.config';

describe('tabs.config active resolution', () => {
  it('marks home active on the tab root segment trail', () => {
    expect(resolveActiveTabKey(['(tabs)'])).toBe('home');
    expect(resolveActiveTabKey(['(tabs)', 'index'])).toBe('home');
    expect(resolveActiveTabKey(['index'])).toBe('home');
    expect(resolveActiveTabKey([])).toBe('home');
  });

  it('marks named tabs active with or without the (tabs) group prefix', () => {
    expect(resolveActiveTabKey(['(tabs)', 'profile'])).toBe('profile');
    expect(resolveActiveTabKey(['profile'])).toBe('profile');
    expect(resolveActiveTabKey(['(tabs)', 'donations', 'rides'])).toBe('donations');
    expect(resolveActiveTabKey(['donations', 'rides'])).toBe('donations');
  });

  it('returns null outside the tab navigator', () => {
    expect(resolveActiveTabKey(['settings'])).toBeNull();
    expect(resolveActiveTabKey(['chat', '[id]'])).toBeNull();
  });

  it('switches icon pairs between filled and outline variants', () => {
    for (const tab of TABS) {
      if (tab.isComposer) continue;
      expect(tab.iconActive).not.toBe(tab.iconInactive);
      expect(tab.iconInactive.endsWith('-outline')).toBe(true);
    }
  });

  it('uses segment membership for rail parity', () => {
    const home = TABS.find((tab) => tab.key === 'home');
    const profile = TABS.find((tab) => tab.key === 'profile');
    expect(home).toBeDefined();
    expect(profile).toBeDefined();
    expect(isTabActive(home!, ['(tabs)'])).toBe(true);
    expect(isTabActive(profile!, ['(tabs)', 'profile', 'closed'])).toBe(true);
    expect(isTabActive(home!, ['(tabs)', 'profile'])).toBe(false);
  });
});
