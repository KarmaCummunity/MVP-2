// Audit §14.4 — rendered when `useChatInit` resolves with no chat row
// (deleted, unauthorized, or never existed). Replaces the prior broken-empty
// header + empty bubble list with a clear "not available" screen.
import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@kc/ui';
import { EmptyState } from '../EmptyState';

interface Props {
  readonly onBack: () => void;
}

export function ChatNotFoundView({ onBack }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <EmptyState
        icon="chatbubble-ellipses-outline"
        title="השיחה לא זמינה"
        subtitle="ייתכן שהשיחה נמחקה או שאין לך גישה אליה."
        action={
          <TouchableOpacity onPress={onBack} accessibilityRole="button">
            <Text style={styles.cta}>חזרה</Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  cta: { ...typography.body, color: colors.primary, paddingVertical: spacing.sm },
});
