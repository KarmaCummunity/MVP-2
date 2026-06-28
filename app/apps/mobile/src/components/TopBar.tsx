// Shared top bar for the in-tabs surface — chat (left), logo (center), settings (right).
// Mirrors the pattern that lived inline in (tabs)/index.tsx; extracted so Profile,
// Donations, and Search can reuse it. The native Tabs header is hidden globally
// (see (tabs)/_layout.tsx) so each tab renders this once inside its own SafeAreaView.
//
// `extraIcon` slot: the feed renders the filter/sort icon there so it's visible
// only on the feed and disappears when navigating to another tab (FR-FEED-004).
import React from 'react';
import { Image, Platform, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, spacing, useTheme } from '@kc/ui';
import { useChatStore } from '../store/chatStore';
import { isLayoutRtl } from '../lib/rtlLayout';

/**
 * Pin the notification badge to the icon's reading-end corner.
 * Native auto-mirrors `end`; RN-Web ignores `start`/`end` for absolute
 * positioning, so on web we resolve RTL live and emit a physical key.
 */
function badgeCornerEnd(): Pick<ViewStyle, 'left' | 'right' | 'end'> {
  if (Platform.OS !== 'web') return { end: 0 };
  return isLayoutRtl() ? { left: 0 } : { right: 0 };
}

interface TopBarProps {
  /** Optional icon rendered between the logo and the settings icon. */
  extraIcon?: React.ReactNode;
}

export function TopBar({ extraIcon }: TopBarProps = {}) {
  const router = useRouter();
  const { t } = useTranslation();
  const styles = useTopBarStyles();
  const { colors } = useTheme();
  const total = useChatStore((s) => s.unreadTotal);
  const display = total > 9 ? '9+' : String(total);

  return (
    <View style={styles.topBar}>
      <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/chat/')} accessibilityLabel={t('chat.title')}>
        <Ionicons name="chatbubbles-outline" size={24} color={colors.textPrimary} />
        {total > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{display}</Text>
          </View>
        )}
      </TouchableOpacity>
      <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <View style={styles.rightGroup}>
        {extraIcon}
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/settings')} accessibilityLabel={t('settings.title')}>
          <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const useTopBarStyles = makeUseStyles(({ colors }) => ({
  topBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    // Cream backdrop + no bottom border so the header floats over the screen,
    // mirroring the welcome screen where the content sits directly on the cream.
    backgroundColor: colors.surfaceCream,
  },
  iconBtn: { padding: spacing.xs, position: 'relative' as const },
  rightGroup: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.xs },
  logo: { height: 32, width: 80 },
  badge: {
    position: 'absolute' as const,
    top: 0,
    ...badgeCornerEnd(),
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  badgeText: { color: colors.textInverse, fontWeight: '700' as const, fontSize: 10 },
}));
