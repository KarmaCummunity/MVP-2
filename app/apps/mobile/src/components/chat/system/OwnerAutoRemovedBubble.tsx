// FR-MOD-010 — owner-facing notice when their post has been auto-removed.
// Read-only; no admin actions.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import he from '../../../i18n/he';
import type { SystemMessageBubbleProps } from './SystemMessageBubble';

export function OwnerAutoRemovedBubble(_props: SystemMessageBubbleProps) {
  const t = he.moderation;
  return (
    <View style={styles.bubble}>
      <Text style={styles.body}>{t.bubble.ownerAutoRemoved.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    padding: 8,
    backgroundColor: '#fee',
    borderRadius: 8,
    marginVertical: 4,
    alignSelf: 'center',
    maxWidth: '90%',
  },
  body: { fontSize: 13, color: '#a30000', textAlign: 'right' },
});
