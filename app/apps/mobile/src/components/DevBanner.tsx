// Visible warning shown at the top of every screen.
//
// Two independent trigger paths:
//   1. EXPO_PUBLIC_ENVIRONMENT === 'development' — fires in ANY bundle
//      (including the Railway production web build) when the app is wired
//      to the dev Supabase project. This is what end-users / beta testers
//      will see on the dev deployment.
//   2. __DEV__ ghost session / auto-sign-in shortcuts — only fires inside
//      a local dev bundle when the developer toggled the shortcut on.
// Both are styled the same so the warning is always recognizable.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { isDevGhostSessionEnabled } from '../services/devGhostSession';
import { isDevAutoSignInEnabled } from '../services/devAutoSignIn';
import { isDevEnvironment } from '../config/environment';

export function DevBanner() {
  const envDev = isDevEnvironment();
  const ghost = __DEV__ && isDevGhostSessionEnabled();
  const auto = __DEV__ && isDevAutoSignInEnabled();

  if (!envDev && !ghost && !auto) return null;

  // Priority: explicit dev shortcuts > env signal (devs already know they're
  // local; the shortcut warning is more actionable).
  const label = ghost
    ? 'DEV GHOST SESSION — fake JWT, Supabase queries will 401'
    : auto
    ? 'DEV AUTO SIGN-IN — real test user'
    : 'סביבת פיתוח · DEV — לא הפרודקשן';

  return (
    <View style={styles.bar} pointerEvents="box-none">
      <Pressable style={styles.inner} accessibilityRole="text">
        <Text style={styles.text}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#B91C1C',
  },
  inner: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
