// FirstPostNudge — the dismissible "share your first post" card at the top
// of the feed. Mapped to FR-FEED-015 (with the three-tier dismissal added in
// P1.2: primary CTA / soft session-dismiss / permanent "אל תציג לי שוב").

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@kc/ui';

interface FirstPostNudgeProps {
  onShare: () => void;
  onRemindLater: () => void;
  onDismissForever: () => void;
}

export function FirstPostNudge({ onShare, onRemindLater, onDismissForever }: FirstPostNudgeProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headline}>
        <Ionicons name="gift-outline" size={20} color={colors.primary} />
        <Text style={styles.title}>יש לך מוצר לתת? או משהו לבקש?</Text>
      </View>
      <Text style={styles.body}>שתף את הפוסט הראשון שלך עכשיו.</Text>

      <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onShare}>
        <Text style={[styles.btnText, styles.btnPrimaryText]}>שתף מוצר</Text>
      </Pressable>

      <Pressable style={[styles.btn, styles.btnSecondary]} onPress={onRemindLater}>
        <Text style={[styles.btnText, styles.btnSecondaryText]}>תזכיר לי אחר כך</Text>
      </Pressable>

      <Pressable style={styles.linkBtn} onPress={onDismissForever} hitSlop={8}>
        <Text style={styles.linkText}>אל תציג לי שוב</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: spacing.base,
    padding: spacing.base,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    gap: spacing.sm,
  },
  headline: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs },
  title: { ...typography.h3, color: colors.textPrimary, textAlign: 'right', flex: 1 },
  body: { ...typography.body, color: colors.textSecondary, textAlign: 'right' },
  btn: {
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnSecondary: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  btnText: { ...typography.body, fontWeight: '700' as const },
  btnPrimaryText: { color: colors.textInverse },
  btnSecondaryText: { color: colors.textPrimary },
  linkBtn: { alignSelf: 'center', paddingVertical: spacing.xs },
  linkText: { ...typography.caption, color: colors.textSecondary, textDecorationLine: 'underline' },
});
