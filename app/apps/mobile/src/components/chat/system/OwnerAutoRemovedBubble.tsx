// FR-MOD-010 — owner-facing notice when their post has been auto-removed.
// Read-only; no admin actions.
import React from 'react';
import { View, Text } from 'react-native';
import { makeUseStyles, radius, typography } from '@kc/ui';
import he from '../../../i18n/locales/he';
import type { SystemMessageBubbleProps } from './SystemMessageBubble';

const useStyles = makeUseStyles(({ colors }) => ({
  bubble: {
    padding: 8,
    backgroundColor: colors.errorLight,
    borderRadius: radius.md,
    marginVertical: 4,
    alignSelf: 'center',
    maxWidth: '90%',
  },
  body: { ...typography.bodySmall, color: colors.error, textAlign: 'right' },
}));

export function OwnerAutoRemovedBubble(_props: SystemMessageBubbleProps) {
  const styles = useStyles();
  const t = he.moderation;
  return (
    <View style={styles.bubble}>
      <Text style={styles.body}>{t.bubble.ownerAutoRemoved.body}</Text>
    </View>
  );
}
