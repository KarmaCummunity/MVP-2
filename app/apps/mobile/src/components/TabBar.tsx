// Floating glass-pill bottom navigation — rendered once at the root layout
// (ShellWithTabBar). The visible bar lives here; expo-router's <Tabs> in
// (tabs)/_layout.tsx suppresses its built-in bar so there is exactly one
// implementation across iOS / Android / Web.
// Mapped to: SRS §6.1 — 5 tabs (RTL: Profile | Search | Plus | Donations | Home), per D-16.
import React from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors } from '@kc/ui';

// Glassmorphism on web — RN-Web forwards unknown style keys to CSS. RN's
// ViewStyle type doesn't include backdrop-filter, so cast through unknown.
const webGlass: ViewStyle =
  Platform.OS === 'web'
    ? ({
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      } as unknown as ViewStyle)
    : ({} as ViewStyle);

type TabKey = 'home' | 'create' | 'profile' | 'search' | 'donations';
type IoniconName = keyof typeof Ionicons.glyphMap;

export const TAB_BAR_HEIGHT = 50;

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
        size={26}
        color={active ? colors.primary : colors.tabInactive}
      />
    </Pressable>
  );
}

interface PlusBtnProps {
  active: boolean;
  onPress: () => void;
  label: string;
}

function PlusBtn({ active, onPress, label }: PlusBtnProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.tabBtn, pressed && styles.tabBtnPressed]}
    >
      <View style={[styles.plusCircle, active && styles.plusCircleActive]}>
        <Ionicons name="add" size={26} color={colors.textInverse} />
      </View>
    </Pressable>
  );
}

export function TabBar() {
  const router = useRouter();
  const { t } = useTranslation();
  const segments = useSegments() as string[];
  const active = activeTab(segments);

  return (
    <View style={styles.tabBar}>
      {/* RTL reading order: Profile (right) | Search | Plus (center) | Donations | Home (left).
          With dir=rtl on web and I18nManager.isRTL on native, default `row` lays them out
          right-to-left. `row-reverse` would double-flip on web → LTR visual. */}
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
      <PlusBtn
        active={active === 'create'}
        onPress={() => router.push('/(tabs)/create')}
        label={t('tabs.newPost')}
      />
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
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    alignItems: 'center',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 12,
    ...webGlass,
  },
  tabBtn: {
    flex: 1,
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnPressed: { opacity: 0.6 },
  plusCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 8,
    elevation: 4,
  },
  plusCircleActive: { backgroundColor: colors.primaryDark },
});
