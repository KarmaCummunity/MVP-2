// FR-MOD-002 AC3 / FR-CHAT-007 AC3 — renders the system message injected when
// a user submits a support issue from Settings → Report an Issue.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import he from '../../../i18n/locales/he';
import type { SystemMessageBubbleProps } from './SystemMessageBubble';

export function SupportIssueBubble({ payload }: SystemMessageBubbleProps) {
  const t = he.moderation.supportIssueBubble;
  const tCategories = (he.settings.reportIssueScreen.categories) as Record<string, string>;

  const issueId = payload?.issue_id as string | undefined;
  const category = payload?.category as string | undefined;
  const description = payload?.description as string | undefined;
  const categoryLabel = category ? (tCategories[category] ?? category) : undefined;

  // Show a short suffix of the UUID so admins can cross-reference without
  // the full 36-char ID overwhelming the bubble.
  const shortId = issueId ? issueId.slice(-8) : undefined;

  return (
    <View style={styles.bubble}>
      <Text style={styles.title}>{t.title}</Text>
      {categoryLabel ? (
        <Text style={styles.row}>
          <Text style={styles.label}>{`${t.categoryLabel} `}</Text>
          {categoryLabel}
        </Text>
      ) : null}
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {shortId ? (
        <Text style={styles.ref}>{`${t.issueRef} …${shortId}`}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    padding: 10,
    backgroundColor: '#e8f4ff',
    borderRadius: 8,
    marginVertical: 4,
    alignSelf: 'center',
    maxWidth: '90%',
    gap: 4,
  },
  title: { fontWeight: '700', fontSize: 14, textAlign: 'right' },
  row: { fontSize: 13, textAlign: 'right' },
  label: { fontWeight: '600' },
  description: { fontSize: 13, textAlign: 'right', color: '#333' },
  ref: { fontSize: 11, color: '#888', textAlign: 'right', marginTop: 2 },
});
