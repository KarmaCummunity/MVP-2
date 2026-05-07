// Bottom Tab Navigator
// Mapped to: SRS §6.1 — 3 tabs (RTL: Profile | Plus | Home), icon-only side tabs.
import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow } from '@kc/ui';

function TabBarIcon({ focused, emoji }: { focused: boolean; emoji: string }) {
  return (
    <View style={tabStyles.iconWrap}>
      <Text style={[tabStyles.emoji, focused && tabStyles.emojiActive]}>{emoji}</Text>
    </View>
  );
}

function PlusTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={tabStyles.plusWrap}>
      <View style={[tabStyles.plusCircle, focused && tabStyles.plusCircleActive]}>
        <Text style={[tabStyles.plusText, focused && tabStyles.plusTextActive]}>+</Text>
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
        tabBarStyle: [
          tabStyles.tabBar,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ],
        tabBarShowLabel: false,
      }}
    >
      {/* RTL order: Profile (right) | Plus (center) | Home (left) */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} emoji="👤" />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ focused }) => <PlusTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} emoji="🏠" />,
        }}
      />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 68,
    flexDirection: 'row-reverse', // RTL tabs
    ...shadow.card,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
    opacity: 0.5,
  },
  emojiActive: {
    opacity: 1,
  },
  plusWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  plusCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusCircleActive: {
    backgroundColor: colors.primary,
  },
  plusText: {
    fontSize: 28,
    color: colors.primary,
    lineHeight: 32,
    fontWeight: '700',
  },
  plusTextActive: {
    color: colors.surface,
  },
});
