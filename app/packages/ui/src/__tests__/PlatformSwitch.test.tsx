/**
 * Smoke tests for PlatformSwitch. We render via @testing-library/react under
 * jsdom, with `react-native` aliased to `react-native-web` in the vitest
 * config. That gives us the WebSwitch branch (since `Platform.OS === 'web'`),
 * which is the variant we actually ship on web.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { PlatformSwitch } from '../index';

afterEach(() => {
  cleanup();
});

describe('PlatformSwitch', () => {
  it('renders with required props (off state)', () => {
    const onValueChange = vi.fn();
    const { getByTestId } = render(
      <PlatformSwitch
        testID="switch-1"
        value={false}
        onValueChange={onValueChange}
        accessibilityLabel="toggle me"
      />,
    );
    expect(getByTestId('switch-1')).toBeTruthy();
  });

  it('renders in the on state without errors', () => {
    const onValueChange = vi.fn();
    const { getByTestId } = render(
      <PlatformSwitch
        testID="switch-on"
        value={true}
        onValueChange={onValueChange}
        accessibilityLabel="toggle me"
      />,
    );
    expect(getByTestId('switch-on')).toBeTruthy();
  });

  it('renders with the positive accent without errors', () => {
    const onValueChange = vi.fn();
    const { getByTestId } = render(
      <PlatformSwitch
        testID="switch-positive"
        value={true}
        onValueChange={onValueChange}
        accent="positive"
        accessibilityLabel="positive toggle"
      />,
    );
    expect(getByTestId('switch-positive')).toBeTruthy();
  });

  it('renders disabled without errors', () => {
    const onValueChange = vi.fn();
    const { getByTestId } = render(
      <PlatformSwitch
        testID="switch-disabled"
        value={false}
        onValueChange={onValueChange}
        disabled
        accessibilityLabel="disabled toggle"
      />,
    );
    expect(getByTestId('switch-disabled')).toBeTruthy();
  });

  it('invokes onValueChange with the toggled value when pressed (web variant)', () => {
    const onValueChange = vi.fn();
    const { getByTestId } = render(
      <PlatformSwitch
        testID="switch-press"
        value={false}
        onValueChange={onValueChange}
        accessibilityLabel="pressable toggle"
      />,
    );
    fireEvent.click(getByTestId('switch-press'));
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('does not invoke onValueChange when disabled (web variant)', () => {
    const onValueChange = vi.fn();
    const { getByTestId } = render(
      <PlatformSwitch
        testID="switch-press-disabled"
        value={false}
        onValueChange={onValueChange}
        disabled
        accessibilityLabel="disabled press"
      />,
    );
    fireEvent.click(getByTestId('switch-press-disabled'));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
