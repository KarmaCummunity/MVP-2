// FR-CHAT-004 — banner shown above thread when anchored post no longer exists.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@kc/ui';

export function AnchorDeletedBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>הפוסט המקורי לא זמין יותר</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  text: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
});
