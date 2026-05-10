// Visible warning shown at the top of every screen when a dev-only auth
// shortcut is active. Renders nothing in production (gated by `__DEV__`,
// dead-code-eliminated by Metro/Expo).
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  isDevGhostSessionEnabled,
} from '../services/devGhostSession';
import { isDevAutoSignInEnabled } from '../services/devAutoSignIn';

export function DevBanner() {
  if (!__DEV__) return null;
  const ghost = isDevGhostSessionEnabled();
  const auto = isDevAutoSignInEnabled();
  if (!ghost && !auto) return null;

  const label = ghost
    ? 'DEV GHOST SESSION — fake JWT, Supabase queries will 401'
    : 'DEV AUTO SIGN-IN — real test user';

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
