// FR-AUTH-015 — Soft gate before first meaningful action
// Provider + hook. Modal lives in OnboardingSoftGateModal.tsx.
import React, { createContext, useCallback, useContext, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { OnboardingSoftGateModal } from './OnboardingSoftGateModal';

type DeferredAction = () => void | Promise<void>;

interface SoftGateContextValue {
  /**
   * If onboarding_state === 'pending_basic_info', open the soft-gate modal and
   * run `action` after Save (FR-AUTH-015 AC3). Cancel = no side effects (AC2).
   * Otherwise, run `action` immediately.
   */
  requestSoftGate: (action: DeferredAction) => void;
}

const SoftGateContext = createContext<SoftGateContextValue | null>(null);

export function useSoftGate(): SoftGateContextValue {
  const ctx = useContext(SoftGateContext);
  if (!ctx) throw new Error('useSoftGate must be used inside <SoftGateProvider>');
  return ctx;
}

export function SoftGateProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [pending, setPending] = useState<DeferredAction | null>(null);

  const requestSoftGate = useCallback((action: DeferredAction) => {
    const state = useAuthStore.getState().onboardingState;
    if (state === 'pending_basic_info') {
      setPending(() => action);
    } else {
      void action();
    }
  }, []);

  const handleClose = useCallback(() => setPending(null), []);

  const handleSaved = useCallback(() => {
    setPending((current) => {
      if (current) void current();
      return null;
    });
  }, []);

  return (
    <SoftGateContext.Provider value={{ requestSoftGate }}>
      {children}
      <OnboardingSoftGateModal
        visible={pending !== null}
        onClose={handleClose}
        onSaved={handleSaved}
      />
    </SoftGateContext.Provider>
  );
}
