// FirstPostNudge — the dismissible "share your first post" card at the top
// of the feed. Mapped to FR-FEED-015 (with the three-tier dismissal added in
// P1.2: primary CTA / soft session-dismiss / permanent dismiss link).

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '@kc/ui';
import { Card } from './ui/Card';
import { IconTile } from './ui/IconTile';

interface FirstPostNudgeProps {
  onShare: () => void;
  onRemindLater: () => void;
  onDismissForever: () => void;
}

export function FirstPostNudge({ onShare, onRemindLater, onDismissForever }: FirstPostNudgeProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.outer}>
      <Card padding="base" style={styles.card}>
        <View style={styles.headline}>
          <IconTile icon="gift-outline" size="sm" />
          <Text style={styles.title}>{t('feed.nudgeTitle')}</Text>
        </View>
        <Text style={styles.body}>{t('feed.nudgeBody')}</Text>

        <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onShare}>
          <Text style={[styles.btnText, styles.btnPrimaryText]}>{t('feed.nudgeShare')}</Text>
        </Pressable>

        <Pressable style={[styles.btn, styles.btnSecondary]} onPress={onRemindLater}>
          <Text style={[styles.btnText, styles.btnSecondaryText]}>{t('feed.nudgeRemindMe')}</Text>
        </Pressable>

        <Pressable style={styles.linkBtn} onPress={onDismissForever} hitSlop={8}>
          <Text style={styles.linkText}>{t('feed.nudgeDontShow')}</Text>
        </Pressable>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { margin: spacing.base },
  card: { gap: spacing.sm },
  headline: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.h3, color: colors.textPrimary, textAlign: 'right', flex: 1 },
  body: { ...typography.body, color: colors.textSecondary, textAlign: 'right' },
  btn: {
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnSecondary: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  btnText: { ...typography.body, fontWeight: '700' as const },
  btnPrimaryText: { color: colors.textInverse },
  btnSecondaryText: { color: colors.textPrimary },
  linkBtn: { alignSelf: 'center', paddingVertical: spacing.xs },
  linkText: { ...typography.caption, color: colors.textSecondary, textDecorationLine: 'underline' },
});
