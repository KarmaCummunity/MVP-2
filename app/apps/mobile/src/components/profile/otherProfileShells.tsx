import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors } from '@kc/ui';
import { otherProfileScreenStyles as styles } from './otherProfileScreen.styles';

export function OtherProfileLoading() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} />
    </SafeAreaView>
  );
}

export function OtherProfileNotFound() {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerTitle: t('profile.headerTitle') }} />
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>{t('profile.userNotFound')}</Text>
      </View>
    </SafeAreaView>
  );
}

type UnavailableProps = { title: string; description: string };

export function OtherProfileUnavailable({ title, description }: UnavailableProps) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerTitle: t('profile.headerTitle') }} />
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>{title}</Text>
        <Text style={styles.unavailableHint}>{description}</Text>
      </View>
    </SafeAreaView>
  );
}
