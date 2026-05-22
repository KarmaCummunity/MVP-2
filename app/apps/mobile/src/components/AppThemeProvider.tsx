// Bridges the persisted theme preference (themeStore) and the OS color scheme
// into @kc/ui's ThemeProvider. Sits high in the tree so every consumer of
// useTheme()/makeUseStyles() resolves against the same context.
import React from 'react';
import { useColorScheme } from 'react-native';
import { ThemeProvider, type ResolvedScheme } from '@kc/ui';
import { useThemeStore } from '../store/themeStore';

export function AppThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  // `useColorScheme()` returns null briefly during cold start on some
  // platforms — default to light so first paint matches the legacy default.
  const osScheme = useColorScheme();
  const systemScheme: ResolvedScheme = osScheme === 'dark' ? 'dark' : 'light';

  return (
    <ThemeProvider mode={mode} systemScheme={systemScheme} setMode={setMode}>
      {children}
    </ThemeProvider>
  );
}
