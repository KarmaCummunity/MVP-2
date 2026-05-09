// Bottom Tab Navigator — owns the tab bar inside (tabs) routes.
// On detail screens (chat, post, user, settings — outside (tabs)), the same
// look-alike bar is rendered globally at the root layout via <TabBar />.
// Both bars use Ionicons (TD-109) — emoji literals were unreliable on iOS
// simulator (Apple Color Emoji glyph cache) and produced tofu boxes.
// Mapped to: SRS §6.1 — 5 tabs (RTL: Profile | Search | Plus | Donations | Home), per D-16.
import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow } from '@kc/ui';

type IoniconName = keyof typeof Ionicons.glyphMap;

function TabBarIcon({ focused, name }: { focused: boolean; name: { active: IoniconName; inactive: IoniconName } }) {
  return (
    <Ionicons
      name={focused ? name.active : name.inactive}
      size={26}
      color={focused ? colors.primary : colors.textSecondary}
    />
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
      {/* RTL order: Profile (right) | Search | Plus (center) | Donations | Home (left) */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} name={{ active: 'person', inactive: 'person-outline' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} name={{ active: 'search', inactive: 'search-outline' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{ tabBarIcon: ({ focused }) => <PlusTabIcon focused={focused} /> }}
      />
      <Tabs.Screen
        name="donations"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} name={{ active: 'heart', inactive: 'heart-outline' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} name={{ active: 'home', inactive: 'home-outline' }} />
          ),
        }}
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
