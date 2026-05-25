import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface ModalStackApi {
  push(): void;
  pop(): void;
  count: number;
}

const ModalStackContext = createContext<ModalStackApi | null>(null);

export function ModalStackProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  const push = useCallback(() => setCount((c) => c + 1), []);
  const pop = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);

  const value = useMemo(() => ({ push, pop, count }), [push, pop, count]);
  return <ModalStackContext.Provider value={value}>{children}</ModalStackContext.Provider>;
}

// Read-only: returns true when no modals/sheets are currently open.
// If the provider isn't mounted, assumes empty (gate won't be deferred forever).
export function useModalStackIsEmpty(): boolean {
  const ctx = useContext(ModalStackContext);
  if (!ctx) return true;
  return ctx.count === 0;
}

// Auto-registers a "modal is currently open" reservation for the lifetime of
// the calling component.
export function useActiveModalReservation(active: boolean): void {
  const ctx = useContext(ModalStackContext);
  useEffect(() => {
    if (!ctx || !active) return;
    ctx.push();
    return () => ctx.pop();
  }, [ctx, active]);
}
