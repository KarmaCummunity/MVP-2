// Single source of truth for the "back" affordance on every detail-screen
// header. Replaces the native auto back button (suppressed via
// `headerBackVisible: false` at the Stack.Screen level) so it's always
// rendered consistently across iOS RTL, Android, and web.
import React from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@kc/ui';

export function BackButton() {
  const { t } = useTranslation();
  const onPress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  };
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={t('general.back')}
      style={{ paddingHorizontal: 8 }}
    >
      <Ionicons name="arrow-forward" size={24} color={colors.primary} />
    </Pressable>
  );
}
