// Bottom Tab Navigator — owns the tab bar inside (tabs) routes.
// On detail screens (chat, post, user, settings — outside (tabs)), the same
// look-alike bar is rendered globally at the root layout via <TabBar />.
// Mapped to: SRS §6.1 — 3 tabs (RTL: Profile | Plus | Home), icon-only side tabs.
import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow } from '@kc/ui';

function TabBarIcon({ focused, emoji }: { focused: boolean; emoji: string }) {
  return (
    <View style={s.iconWrap}>
      <Text style={[s.emoji, focused && s.emojiActive]}>{emoji}</Text>
    </View>
  );
}

function PlusTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={s.plusWrap}>
      <View style={[s.plusCircle, focused && s.plusCircleActive]}>
        <Text style={[s.plusText, focused && s.plusTextActive]}>+</Text>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [s.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }],
        tabBarShowLabel: false,
      }}
    >
      {/* RTL order: Profile (right) | Plus (center) | Home (left) */}
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} emoji="👤" /> }}
      />
      <Tabs.Screen
        name="create"
        options={{ tabBarIcon: ({ focused }) => <PlusTabIcon focused={focused} /> }}
      />
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} emoji="🏠" /> }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 68,
    flexDirection: 'row-reverse',
    ...shadow.card,
  },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24, opacity: 0.5 },
  emojiActive: { opacity: 1 },
  plusWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  plusCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  plusCircleActive: { backgroundColor: colors.primary },
  plusText: { fontSize: 28, color: colors.primary, lineHeight: 32, fontWeight: '700' },
  plusTextActive: { color: colors.surface },
});
