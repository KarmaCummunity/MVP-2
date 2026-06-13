import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

type AsideRender = () => ReactNode;

type AsideContextValue = {
  render: AsideRender | undefined;
  setRender: Dispatch<SetStateAction<AsideRender | undefined>>;
};

const AsideContext = createContext<AsideContextValue | undefined>(undefined);

export function AsideProvider({ children }: { children: ReactNode }) {
  const [render, setRender] = useState<AsideRender | undefined>(undefined);
  const value = useMemo<AsideContextValue>(() => ({ render, setRender }), [render]);
  return <AsideContext.Provider value={value}>{children}</AsideContext.Provider>;
}

function useAsideContextOrThrow(): AsideContextValue {
  const ctx = useContext(AsideContext);
  if (!ctx) throw new Error('useAside / useAsideContent must be used inside <AsideProvider>');
  return ctx;
}

/**
 * Publish a render function for the active screen's aside panel.
 * On mobile, the consumer (AppShell) ignores this — but the hook
 * itself is safe to call from any screen at any breakpoint.
 *
 * `enabled` lets screens that stay mounted while unfocused (tab scenes)
 * withdraw their content so the focused screen's aside wins.
 */
export function useAside(
  render: AsideRender,
  deps: ReadonlyArray<unknown>,
  enabled = true,
): void {
  const { setRender } = useAsideContextOrThrow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useCallback(render, deps);
  useEffect(() => {
    if (!enabled) return undefined;
    setRender(() => memoized);
    return () => setRender(undefined);
  }, [memoized, setRender, enabled]);
}

export function useAsideContent(): AsideRender | undefined {
  return useAsideContextOrThrow().render;
}
