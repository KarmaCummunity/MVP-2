// FR-MOD-010 AC4 — terminal screen rendered when the account gate denies the user.
// Lives at the top level (outside the (auth) group) so a signed-out user can land
// on it directly after the gate hook signs them out.
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography } from '@kc/ui';
import he from '../src/i18n/he';

const SUPPORT_MAIL = 'mailto:karmacommunity2.0@gmail.com';

type Reason = 'banned' | 'suspended_admin' | 'suspended_for_false_reports';

function pickContent(reason: string | undefined) {
  const t = he.accountBlocked;
  switch (reason as Reason | undefined) {
    case 'suspended_admin':
      return t.suspendedAdmin;
    case 'suspended_for_false_reports':
      return t.suspendedForFalseReports;
    case 'banned':
    default:
      return t.banned;
  }
}

export default function AccountBlockedScreen() {
  const { reason, until } = useLocalSearchParams<{ reason?: string; until?: string }>();
  const content = pickContent(reason);

  const formattedUntil = until
    ? new Date(until).toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  const body = (content.body ?? '').replace('{until}', formattedUntil);

  return (
    <>
      <Stack.Screen options={{ headerTitle: '', headerBackVisible: false }} />
      <View style={styles.container}>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.body}>{body}</Text>
        <Pressable onPress={() => Linking.openURL(SUPPORT_MAIL)}>
          <Text style={styles.cta}>{content.cta}</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cta: {
    ...typography.button,
    color: colors.primary,
    marginTop: spacing.base,
    textDecorationLine: 'underline',
  },
});
