// FR-ADMIN-002..005 — neutral "handled" bubble. Renders the body provided by
// the trigger (server already substitutes action/time); falls back to the
// template-with-blanks if the body is empty.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import he from '../../../i18n/he';
import type { SystemMessageBubbleProps } from './SystemMessageBubble';

export function ModActionTakenBubble({ body, createdAt }: SystemMessageBubbleProps) {
  const t = he.moderation;
  const time = new Date(createdAt).toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const fallback = t.bubble.modActionTaken.body
    .replace('{time}', time)
    .replace('{action}', '');
  const text = body.length > 0 ? body : fallback;
  return (
    <View style={styles.bubble}>
      <Text style={styles.body}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { padding: 6, alignSelf: 'center', opacity: 0.6 },
  body: { fontSize: 12, color: '#666' },
});
