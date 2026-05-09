// Shared top bar for the in-tabs surface — chat (left), logo (center), settings (right).
// Mirrors the pattern that lived inline in (tabs)/index.tsx; extracted so Profile,
// Donations, and Search can reuse it. The native Tabs header is hidden globally
// (see (tabs)/_layout.tsx) so each tab renders this once inside its own SafeAreaView.
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@kc/ui';
import { useChatStore } from '../store/chatStore';

export function TopBar() {
  const router = useRouter();
  const total = useChatStore((s) => s.unreadTotal);
  const display = total > 9 ? '9+' : String(total);

  return (
    <View style={styles.topBar}>
      <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/chat/')} accessibilityLabel="שיחות">
        <Ionicons name="chatbubbles-outline" size={24} color={colors.textPrimary} />
        {total > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{display}</Text>
          </View>
        )}
      </TouchableOpacity>
      <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/settings')} accessibilityLabel="הגדרות">
        <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: { padding: spacing.xs, position: 'relative' },
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
