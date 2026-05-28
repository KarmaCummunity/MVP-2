// FR-RESEARCH-004 — entry row in /settings/surveys (placement 3) that opens
// the share sheet for the public research survey. The only in-app surface
// for FR-RESEARCH-004; placements 1 and 2 live on the public web pages.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, radius, spacing, typography } from '@kc/ui';
import {
  shareResearchSurvey,
  RESEARCH_SHARE_SRC_SETTINGS,
} from '../../lib/shareResearchSurvey';
import { rtlTextAlignStart } from '../../lib/rtlTextAlignStart';
import { webTextRtl, webViewRtl } from '../../lib/webRtlStyle';
import { track } from '../../lib/analytics';
import { useFeedSessionStore } from '../../store/feedSessionStore';

const WEB_BASE_URL =
  (process.env.EXPO_PUBLIC_WEB_BASE_URL as string | undefined) ??
  'https://mvp-2-dev.up.railway.app';

export function ShareResearchRow(): React.JSX.Element {
  const { t } = useTranslation();
  const styles = useShareResearchRowStyles();
  const showToast = useFeedSessionStore((s) => s.showEphemeralToast);

  const onPress = async () => {
    const outcome = await shareResearchSurvey({
      webBaseUrl: WEB_BASE_URL,
      src: RESEARCH_SHARE_SRC_SETTINGS,
      title: t('survey.shareResearch.shareTitle'),
      message: t('survey.shareResearch.shareMessage'),
    });

    track('research_share_initiated', {
      slug: 'alt-platforms-research',
      src: RESEARCH_SHARE_SRC_SETTINGS,
      outcome: outcome.kind,
    });

    if (outcome.kind === 'shared') {
      showToast(t('survey.shareResearch.toastShared'), 'success', 2200);
    } else if (outcome.kind === 'copied') {
      showToast(t('survey.shareResearch.toastCopied'), 'success', 2200);
    } else if (outcome.kind === 'failed') {
      showToast(t('survey.shareResearch.toastFailed'), 'error', 2200);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.textBlock}>
        <Text style={styles.title}>{t('survey.shareResearch.rowTitle')}</Text>
        <Text style={styles.subtitle}>{t('survey.shareResearch.rowSubtitle')}</Text>
      </View>
    </Pressable>
  );
}

const useShareResearchRowStyles = makeUseStyles(({ colors }) => ({
  row: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...webViewRtl,
  },
  rowPressed: { opacity: 0.7 },
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
