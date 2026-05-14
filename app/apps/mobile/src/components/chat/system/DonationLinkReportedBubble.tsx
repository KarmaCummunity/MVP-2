// FR-DONATE AC2 — admin-facing bubble for donation-link reports.
// Renders a tappable card that opens the reported URL in the external
// browser. Admin-gated (consistent with ReportReceivedBubble).
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsSuperAdmin } from '../../../hooks/useIsSuperAdmin';
import { openExternalUrl } from '../../../utils/openExternalUrl';
import he from '../../../i18n/locales/he';
import type { SystemMessageBubbleProps } from './SystemMessageBubble';

export function DonationLinkReportedBubble({
  payload,
  handledByLaterAction,
}: SystemMessageBubbleProps) {
  const isAdmin = useIsSuperAdmin();
  const t = he.moderation.bubble;
  const url = typeof payload?.url === 'string' ? payload.url : null;
  const displayName = typeof payload?.display_name === 'string' ? payload.display_name : null;
  const categorySlug = typeof payload?.category_slug === 'string' ? payload.category_slug : null;
  const showCard = isAdmin && !!url;

  return (
    <View style={[styles.bubble, handledByLaterAction && styles.dimmed]}>
      <Text style={styles.title}>{t.donationLinkReported.title}</Text>
      {showCard && url ? (
        <Pressable
          onPress={() => openExternalUrl(url)}
          accessibilityRole="button"
          accessibilityLabel={t.donationLinkReported.a11yOpen.replace('{name}', displayName ?? url)}
          style={styles.card}
        >
          {displayName ? <Text style={styles.handle}>{displayName}</Text> : null}
          <Text style={styles.snippet} numberOfLines={2}>{url}</Text>
          {categorySlug ? <Text style={styles.snippet}>{`#${categorySlug}`}</Text> : null}
          <View style={styles.openRow}>
            <Ionicons name="open-outline" size={16} color="#1a3d8f" />
            <Text style={styles.openText}>{t.targetPreview.open}</Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    padding: 8,
    backgroundColor: '#fff7e0',
    borderRadius: 8,
    marginVertical: 4,
    alignSelf: 'center',
    maxWidth: '90%',
  },
  dimmed: { opacity: 0.5 },
  title: { fontWeight: '600' },
  card: {
    marginTop: 6,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e0d8b0',
    minHeight: 44,
  },
  handle: { fontWeight: '600' },
  snippet: { fontSize: 13, marginTop: 2 },
  openRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  openText: { color: '#1a3d8f', fontWeight: '600', fontSize: 13 },
});
