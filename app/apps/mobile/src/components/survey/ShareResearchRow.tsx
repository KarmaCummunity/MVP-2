// FR-RESEARCH-004 — entry row in /settings/surveys (placement 3).
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { makeUseStyles, radius, spacing, typography, useTheme } from '@kc/ui';
import { RESEARCH_SHARE_SRC_SETTINGS } from '../../lib/shareResearchSurvey';
import { rtlTextAlignStart } from '../../lib/rtlTextAlignStart';
import { webTextRtl, webViewRtl } from '../../lib/webRtlStyle';
import { triggerResearchShare } from '../../lib/triggerResearchShare';
import { useFeedSessionStore } from '../../store/feedSessionStore';

export function ShareResearchRow(): React.JSX.Element {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useShareResearchRowStyles();
  const showToast = useFeedSessionStore((s) => s.showEphemeralToast);

  const onPress = () =>
    triggerResearchShare(
      RESEARCH_SHARE_SRC_SETTINGS,
      {
        title: t('survey.shareResearch.shareTitle'),
        message: t('survey.shareResearch.shareMessage'),
        toastShared: t('survey.shareResearch.toastShared'),
        toastCopied: t('survey.shareResearch.toastCopied'),
        toastFailed: t('survey.shareResearch.toastFailed'),
      },
      showToast,
    );

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.rowMain, pressed && styles.rowPressed]}
      >
        <View style={styles.textBlock}>
          <Text style={styles.title}>{t('survey.shareResearch.rowTitle')}</Text>
          <Text style={styles.subtitle}>{t('survey.shareResearch.rowSubtitle')}</Text>
        </View>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.shareIconBtn, pressed && styles.rowPressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t('survey.shareResearch.cardShareA11y')}
        hitSlop={8}
      >
        <Ionicons name="share-social-outline" size={24} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const useShareResearchRowStyles = makeUseStyles(({ colors }) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...webViewRtl,
  },
  rowMain: { flex: 1 },
  rowPressed: { opacity: 0.7 },
  shareIconBtn: { padding: spacing.xs },
  textBlock: { gap: 4 },
  title: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
    ...webTextRtl,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: rtlTextAlignStart,
    ...webTextRtl,
  },
}));
