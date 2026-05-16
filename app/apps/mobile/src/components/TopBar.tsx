// Shared top bar for the in-tabs surface — chat (left), logo (center), settings (right).
// Mirrors the pattern that lived inline in (tabs)/index.tsx; extracted so Profile,
// Donations, and Search can reuse it. The native Tabs header is hidden globally
// (see (tabs)/_layout.tsx) so each tab renders this once inside its own SafeAreaView.
//
// `extraIcon` slot: the feed renders the filter/sort icon there so it's visible
// only on the feed and disappears when navigating to another tab (FR-FEED-004).
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '@kc/ui';
import { useChatStore } from '../store/chatStore';

interface TopBarProps {
  /** Optional icon rendered between the logo and the settings icon. */
  extraIcon?: React.ReactNode;
}

export function TopBar({ extraIcon }: TopBarProps = {}) {
  const router = useRouter();
  const { t } = useTranslation();
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

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    // Cream backdrop + no bottom border so the header floats over the screen,
    // mirroring the welcome screen where the content sits directly on the cream.
    backgroundColor: colors.surfaceCream,
  },
  iconBtn: { padding: spacing.xs, position: 'relative' },
  rightGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  logo: { height: 32, width: 80 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: colors.textInverse, fontWeight: '700' as const, fontSize: 10 },
});
