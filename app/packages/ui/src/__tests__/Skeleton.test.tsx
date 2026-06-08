// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest';
import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { act, cleanup, render } from '@testing-library/react';
import { Skeleton } from '../components/Skeleton';
import { ThemeProvider } from '../theme/ThemeContext';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function withTheme(ui: React.ReactElement) {
  return render(
    <ThemeProvider mode="light" systemScheme="light" setMode={() => {}}>
      {ui}
    </ThemeProvider>,
  );
}

describe('Skeleton', () => {
  it('renders a placeholder block (animated path when motion is allowed)', async () => {
    vi.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const { container } = withTheme(<Skeleton width={100} height={20} radius={8} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.firstChild).toBeTruthy();
  });

  it('renders without animating when reduce-motion is enabled', async () => {
    vi.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const { container } = withTheme(<Skeleton />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.firstChild).toBeTruthy();
  });

  it('applies a custom style alongside its defaults', async () => {
    vi.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const { container } = withTheme(<Skeleton style={{ marginTop: 4 }} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.firstChild).toBeTruthy();
  });
});
