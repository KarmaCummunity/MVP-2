// Bottom Tab Navigator
// Mapped to: SRS §6.1 — 3 tabs (RTL: Profile | Plus | Home)
import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity, View, StyleSheet, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, shadow, typography } from '@kc/ui';

function TabBarIcon({ focused, emoji, label }: { focused: boolean; emoji: string; label: string }) {
  return (
    <View style={[tabStyles.iconWrap]}>
      <Text style={[tabStyles.emoji, focused && tabStyles.emojiActive]}>{emoji}</Text>
      <Text style={[tabStyles.label, focused ? tabStyles.labelActive : tabStyles.labelInactive]}>
        {label}
      </Text>
    </View>
  );
}

function PlusTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={tabStyles.plusWrap}>
      <View style={[tabStyles.plusCircle, focused && tabStyles.plusCircleActive]}>
        <Text style={tabStyles.plusText}>+</Text>
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
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} emoji="👤" label="פרופיל" />
          ),
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
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} emoji="🏠" label="בית" />
          ),
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
    gap: 2,
  },
  emoji: {
    fontSize: 22,
    opacity: 0.5,
  },
  emojiActive: {
    opacity: 1,
  },
  label: {
    ...typography.caption,
  },
  labelActive: {
    color: colors.tabActive,
    fontWeight: '600',
  },
  labelInactive: {
    color: colors.tabInactive,
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
});
