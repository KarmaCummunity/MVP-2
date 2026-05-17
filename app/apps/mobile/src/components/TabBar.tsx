// Single global tab bar — rendered at the root layout for every post-auth,
// post-onboarding route OUTSIDE (tabs). Inside (tabs), the native expo-router
// <Tabs> in (tabs)/_layout.tsx owns its own bar; the root layout hides this
// global bar there to avoid doubling.
// Plus button is an absolutely-positioned overlay so the pill itself never
// needs overflow:'visible' — that property breaks borderRadius background
// clipping on RN Web, causing the white-rectangle artifact.
// Mapped to: SRS §6.1 — 5 tabs (RTL: Profile | Search | Plus | Donations | Home), per D-16.
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors } from '@kc/ui';

export const PILL_HEIGHT = 62;
const PLUS_SIZE = 52;
const PLUS_OVERHANG = 14; // px the plus circle extends above the pill top

type TabKey = 'home' | 'create' | 'profile' | 'search' | 'donations';

type IoniconName = keyof typeof Ionicons.glyphMap;

function activeTab(segments: string[]): TabKey | null {
  if (segments[0] === '(tabs)') {
    if (segments[1] === 'profile') return 'profile';
    if (segments[1] === 'create') return 'create';
    if (segments[1] === 'search') return 'search';
    if (segments[1] === 'donations') return 'donations';
    return 'home';
  }
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
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.tabBtn, pressed && styles.tabBtnPressed]}
    >
      <Ionicons
        name={active ? iconActive : iconInactive}
        size={24}
        color={active ? colors.primary : colors.textDisabled}
      />
      {active && <View style={styles.activeDot} />}
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
    <View style={styles.container}>
      {/* Pill — no overflow:'visible' so borderRadius clips bg correctly on web */}
      <View
        style={[
          styles.pill,
          { marginBottom: insets.bottom },
          Platform.OS === 'web' && styles.pillWeb,
        ]}
      >
        {/* RTL: Profile (right) | Search | [space] | Donations | Home (left) */}
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
        {/* Empty flex slot — the plus circle floats above this via the overlay */}
        <View style={styles.plusSpace} />
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

      {/* Plus button — absolute overlay so it floats above the pill without
          forcing overflow:'visible' on the pill itself */}
      <View
        style={[styles.plusOverlay, { bottom: insets.bottom, pointerEvents: 'box-none' }]}
      >
        <Pressable
          onPress={() => router.push('/(tabs)/create')}
          accessibilityRole="button"
          accessibilityLabel={t('tabs.newPost')}
          style={({ pressed }) => [pressed && { opacity: 0.75 }]}
        >
          <View style={[styles.plusCircle, active === 'create' && styles.plusCircleActive]}>
            <Ionicons
              name="add"
              size={28}
              color={active === 'create' ? colors.surface : colors.primary}
            />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  pill: {
    flexDirection: 'row',
    height: PILL_HEIGHT,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.55)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 10,
  },
  pillWeb: {
    // @ts-ignore web-only CSS property
    backdropFilter: 'blur(16px)',
    // @ts-ignore web-only CSS property
    WebkitBackdropFilter: 'blur(16px)',
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabBtnPressed: {
    opacity: 0.60,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  plusSpace: {
    flex: 1,
  },
  plusOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    // Position so the circle protrudes PLUS_OVERHANG px above the pill top.
    // Bottom of the overlay = bottom of the pill (handled by `bottom: insets.bottom`
    // from the inline style). Top determined by height of plusCircle + overhang.
    top: -PLUS_OVERHANG,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  plusCircle: {
    width: PLUS_SIZE,
    height: PLUS_SIZE,
    borderRadius: PLUS_SIZE / 2,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  plusCircleActive: {
    backgroundColor: colors.primary,
  },
});
