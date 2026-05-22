// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Text } from 'react-native';
import { AsideProvider, useAside, useAsideContent } from '../components/AsideContext';

function Publisher() {
  useAside(() => <Text testID="aside-content">hello aside</Text>, []);
  return null;
}

function Consumer() {
  const render = useAsideContent();
  return <>{render?.()}</>;
}

afterEach(() => {
  cleanup();
});

describe('AsideContext', () => {
  it('publishes content from a child and exposes it via useAsideContent', () => {
    render(
      <AsideProvider>
        <Publisher />
        <Consumer />
      </AsideProvider>
    );
    expect(screen.getByTestId('aside-content').textContent).toBe('hello aside');
  });

  it('exposes undefined when no publisher is mounted', () => {
    render(
      <AsideProvider>
        <Consumer />
      </AsideProvider>
    );
    expect(screen.queryByTestId('aside-content')).toBeNull();
  });
});
