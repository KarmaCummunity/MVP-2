import { describe, it, expect, beforeEach } from 'vitest';
import { useActiveScreenStore } from '../useActiveScreenStore';

beforeEach(() => {
  useActiveScreenStore.setState({ route: null });
});

describe('useActiveScreenStore', () => {
  it('starts with route=null (non-React readers see "unknown" until set)', () => {
    expect(useActiveScreenStore.getState().route).toBeNull();
  });

  it('setRoute writes the current pathname', () => {
    useActiveScreenStore.getState().setRoute('/chat/c_1');
    expect(useActiveScreenStore.getState().route).toBe('/chat/c_1');
  });

  it('setRoute(null) clears the route (e.g. on auth landing)', () => {
    useActiveScreenStore.getState().setRoute('/feed');
    useActiveScreenStore.getState().setRoute(null);
    expect(useActiveScreenStore.getState().route).toBeNull();
  });

  it('overwrites on consecutive setRoute calls (no concat / no history)', () => {
    useActiveScreenStore.getState().setRoute('/a');
    useActiveScreenStore.getState().setRoute('/b');
    useActiveScreenStore.getState().setRoute('/c');
    expect(useActiveScreenStore.getState().route).toBe('/c');
  });
});
