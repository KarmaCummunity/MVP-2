// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react';

interface DeviceProfile {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly topInset: number;
  readonly bottomInset: number;
}

const DEVICES: readonly DeviceProfile[] = [
  { name: 'iPhone SE 2nd/3rd gen',          width: 375, height: 667, topInset: 20, bottomInset: 0 },
  { name: 'iPhone 13 mini',                 width: 375, height: 812, topInset: 50, bottomInset: 34 },
  { name: 'iPhone 16 Pro',                  width: 393, height: 852, topInset: 59, bottomInset: 34 },
  { name: 'iPhone 16 Pro Max',              width: 430, height: 932, topInset: 59, bottomInset: 34 },
  { name: 'Android compact (gesture nav)',  width: 360, height: 800, topInset: 24, bottomInset: 16 },
  { name: 'Android compact (3-button nav)', width: 360, height: 800, topInset: 24, bottomInset: 48 },
];

const TAB_BAR_PILL_PX = 76; // matches navigation/useShellTabBarVisibility#TAB_BAR_HEIGHT

const capturedContentStyles: unknown[] = [];

vi.mock('react-native', async () => {
  const actual = await vi.importActual<typeof import('react-native')>('react-native');
  return {
    ...actual,
    ScrollView: (props: { contentContainerStyle?: unknown; children: React.ReactNode }) => {
      capturedContentStyles.push(props.contentContainerStyle);
      return React.createElement('div', { 'data-testid': 'mock-scrollview' }, props.children);
    },
  };
});

vi.mock('../AmbientBlobs', () => ({ AmbientBlobs: () => null }));

vi.mock('@kc/ui', async () => {
  const actual = await vi.importActual<typeof import('@kc/ui')>('@kc/ui');
  return { ...actual, useTheme: () => ({ colors: { surfaceCream: '#FFFBF7' }, isDark: false }) };
});

let mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
let mockVisible = true;

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  useSafeAreaInsets: () => mockInsets,
}));

vi.mock('../../../navigation/useShellTabBarVisibility', () => ({
  useShellTabBarVisibility: () => mockVisible,
  shellTabBarHeightPx: (v: boolean) => (v ? TAB_BAR_PILL_PX : 0),
  // Mirrors the real hook: spacing.lg(20) + TAB_BAR_HEIGHT(76) + insets.bottom
  useShellTabBarScrollInset: () => 20 + TAB_BAR_PILL_PX + mockInsets.bottom,
}));

function flattenStyle(input: unknown): Record<string, unknown> {
  if (Array.isArray(input)) return Object.assign({}, ...input.filter(Boolean));
  return (input as Record<string, unknown>) ?? {};
}

describe('Screen — device-matrix tab-bar inset coverage (FR-RESP-006 AC1)', () => {
  beforeEach(() => {
    capturedContentStyles.length = 0;
    mockVisible = true;
  });

  it.each(DEVICES)(
    'reserves >= pill + bottom inset on $name',
    async (device) => {
      mockInsets = { top: device.topInset, bottom: device.bottomInset, left: 0, right: 0 };
      const { Screen } = await import('../Screen');
      render(
        <Screen scroll>
          <Text>body</Text>
        </Screen>,
      );
      const flat = flattenStyle(capturedContentStyles.at(-1));
      const minRequired = TAB_BAR_PILL_PX + device.bottomInset;
      expect(flat.paddingBottom).toBeGreaterThanOrEqual(minRequired);
    },
  );

  it('omits paddingBottom when tab bar is suppressed (e.g. chat conversation)', async () => {
    mockInsets = { top: 47, bottom: 34, left: 0, right: 0 };
    mockVisible = false;
    const { Screen } = await import('../Screen');
    render(
      <Screen scroll>
        <Text>body</Text>
      </Screen>,
    );
    const flat = flattenStyle(capturedContentStyles.at(-1));
    expect(flat.paddingBottom).toBeUndefined();
  });
});
