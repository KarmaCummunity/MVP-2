// Single global tab bar — rendered at the root layout for every post-auth,
// post-onboarding route OUTSIDE (tabs) (i.e. detail screens like chat/[id],
// post/[id], user/[handle], settings). Inside (tabs), the native expo-router
// <Tabs> in (tabs)/_layout.tsx owns its own bar; the root layout hides this
// global bar there to avoid doubling. Both bars use Ionicons (TD-109) — emoji
// literals were unreliable on iOS simulator and produced "?" tofu boxes.
// Mapped to: SRS §6.1 — 5 tabs (RTL: Profile | Search | Plus | Donations | Home), per D-16.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, shadow } from '@kc/ui';

type TabKey = 'home' | 'create' | 'profile' | 'search' | 'donations';

type IoniconName = keyof typeof Ionicons.glyphMap;

function activeTab(segments: string[]): TabKey | null {
  // segments[0] is the route group / first path segment.
  if (segments[0] === '(tabs)') {
    if (segments[1] === 'profile') return 'profile';
    if (segments[1] === 'create') return 'create';
    if (segments[1] === 'search') return 'search';
    if (segments[1] === 'donations') return 'donations';
    return 'home';
  }
  // Detail screens: highlight nothing — they're modal-ish to the tab flow.
  return null;
}

interface IconBtnProps {
  active: boolean;
  onPress: () => void;
  label: string;
  iconActive: IoniconName;
  iconInactive: IoniconName;
}

function IconBtn({ active, onPress, label, iconActive, iconInactive }: IconBtnProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.tabBtn}>
      <Ionicons
        name={active ? iconActive : iconInactive}
        size={26}
        color={active ? colors.primary : colors.textSecondary}
      />
    </Pressable>
  );
}

export function TabBar() {
  const router = useRouter();
  const { t } = useTranslation();
  const segments = useSegments() as string[];
  const insets = useSafeAreaInsets();
  const active = activeTab(segments);

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* RTL: Profile (right) | Search | Plus (center) | Donations | Home (left) */}
      <IconBtn
        active={active === 'profile'}
        onPress={() => router.push('/(tabs)/profile')}
        label={t('tabs.profile')}
        iconActive="person"
        iconInactive="person-outline"
      />
      <IconBtn
        active={active === 'search'}
        onPress={() => router.push('/(tabs)/search')}
        label={t('search.tabLabel')}
        iconActive="search"
        iconInactive="search-outline"
      />
      <Pressable
        onPress={() => router.push('/(tabs)/create')}
        accessibilityRole="button"
        accessibilityLabel={t('tabs.newPost')}
        style={styles.plusTabBtn}
      >
        <View style={[styles.plusCircle, active === 'create' && styles.plusCircleActive]}>
          <Text style={[styles.plusText, active === 'create' && styles.plusTextActive]}>+</Text>
        </View>
      </Pressable>
      <IconBtn
        active={active === 'donations'}
        onPress={() => router.push('/(tabs)/donations')}
        label={t('donations.tabLabel')}
        iconActive="heart"
        iconInactive="heart-outline"
      />
      <IconBtn
        active={active === 'home'}
        onPress={() => router.push('/(tabs)')}
        label={t('tabs.home')}
        iconActive="home"
        iconInactive="home-outline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    // Children are written in RTL reading order (Profile, Search, +, Donations, Home).
    // With dir=rtl on web and I18nManager.isRTL on native, default `row` lays them
    // out right-to-left. `row-reverse` would double-flip on web → LTR visual.
    flexDirection: 'row',
    height: 68, // explicit — without this, RN-Web collapses the row to 0px
    paddingTop: 8,
    overflow: 'visible', // allow the plus circle to protrude above the bar
    ...shadow.card,
  },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  plusTabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  plusCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16, // protrude above the tab bar; negative margin keeps touch target aligned
    ...shadow.card,
  },
  plusCircleActive: { backgroundColor: colors.primary },
  plusText: { fontSize: 32, color: colors.primary, lineHeight: 36, fontWeight: '700' },
  plusTextActive: { color: colors.surface },
});
