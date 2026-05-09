// Single global tab bar — rendered at the root layout for every post-auth,
// post-onboarding route OUTSIDE (tabs) (i.e. detail screens like chat/[id],
// post/[id], user/[handle], settings). Inside (tabs), the native expo-router
// <Tabs> in (tabs)/_layout.tsx owns its own bar; the root layout hides this
// global bar there to avoid doubling. Both bars use Ionicons (TD-109) — emoji
// literals were unreliable on iOS simulator and produced "?" tofu boxes.
// Mapped to: SRS §6.1 — 3 tabs (RTL: Profile | Plus | Home), icon-only.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow } from '@kc/ui';

type TabKey = 'home' | 'create' | 'profile';

function activeTab(segments: string[]): TabKey | null {
  // segments[0] is the route group / first path segment.
  if (segments[0] === '(tabs)') {
    if (segments[1] === 'profile') return 'profile';
    if (segments[1] === 'create') return 'create';
    return 'home';
  }
  // Detail screens: highlight nothing — they're modal-ish to the tab flow.
  return null;
}

export function TabBar() {
  const router = useRouter();
  const segments = useSegments() as string[];
  const insets = useSafeAreaInsets();
  const active = activeTab(segments);

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* RTL: Profile (right) | Plus (center) | Home (left) */}
      <Pressable
        onPress={() => router.push('/(tabs)/profile')}
        accessibilityRole="button"
        accessibilityLabel="פרופיל"
        style={styles.tabBtn}
      >
        <Ionicons
          name={active === 'profile' ? 'person' : 'person-outline'}
          size={26}
          color={active === 'profile' ? colors.primary : colors.textSecondary}
        />
      </Pressable>
      <Pressable
        onPress={() => router.push('/(tabs)/create')}
        accessibilityRole="button"
        accessibilityLabel="פוסט חדש"
        style={styles.tabBtn}
      >
        <View style={[styles.plusCircle, active === 'create' && styles.plusCircleActive]}>
          <Text style={[styles.plusText, active === 'create' && styles.plusTextActive]}>+</Text>
        </View>
      </Pressable>
      <Pressable
        onPress={() => router.push('/(tabs)')}
        accessibilityRole="button"
        accessibilityLabel="בית"
        style={styles.tabBtn}
      >
        <Ionicons
          name={active === 'home' ? 'home' : 'home-outline'}
          size={26}
          color={active === 'home' ? colors.primary : colors.textSecondary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row-reverse', // RTL
    height: 68, // explicit — without this, RN-Web collapses the row to 0px
    paddingTop: 8,
    ...shadow.card,
  },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  plusCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  plusCircleActive: { backgroundColor: colors.primary },
  plusText: { fontSize: 28, color: colors.primary, lineHeight: 32, fontWeight: '700' },
  plusTextActive: { color: colors.surface },
});
