import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';

export type AboutContentScope = 'mvp' | 'vision';

interface Ctx {
  readonly scope: AboutContentScope;
  readonly setScope: (s: AboutContentScope) => void;
}

const AboutContentScopeContext = createContext<Ctx | null>(null);

export function AboutContentScopeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [scope, setScope] = useState<AboutContentScope>('mvp');

  useFocusEffect(
    useCallback(() => {
      setScope('mvp');
    }, []),
  );

  const value = useMemo(() => ({ scope, setScope }), [scope]);
  return <AboutContentScopeContext.Provider value={value}>{children}</AboutContentScopeContext.Provider>;
}

export function useAboutContentScope(): Ctx {
  const v = useContext(AboutContentScopeContext);
  if (!v) throw new Error('useAboutContentScope must be used within AboutContentScopeProvider');
  return v;
}
