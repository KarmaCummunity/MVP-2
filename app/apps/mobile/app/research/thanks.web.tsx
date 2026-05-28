// Web-only thank-you page for public research form — FR-RESEARCH-001 AC5, FR-RESEARCH-003 AC4.
// .web.tsx extension: file is excluded from iOS/Android bundles entirely.
//
// V1: email opt-in shown but not wired to a separate DB write (the main form
// already captures email at Q11). Full separate opt-in capture deferred.
// TD-FE-research: thanks page email opt-in separate DB write not wired in V1.
import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, spacing, typography, useTheme } from '@kc/ui';
import { webTextRtl, webViewRtl } from '../../src/lib/webRtlStyle';
import { rtlTextAlignStart } from '../../src/lib/rtlTextAlignStart';
import {
  shareResearchSurvey,
  RESEARCH_SHARE_SRC_THANKS,
  type ShareResearchOutcome,
} from '../../src/lib/shareResearchSurvey';
import { track } from '../../src/lib/analytics';

// TODO: replace with official marketing site URL when available.
const KARMA_SITE_URL = 'https://karma.community';
const AUTO_REDIRECT_MS = 5000;

export default function ResearchThanksScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [showVisitLink, setShowVisitLink] = useState(false);
  const [shareStatus, setShareStatus] = useState<ShareResearchOutcome['kind'] | null>(null);

  // After AUTO_REDIRECT_MS, reveal the "visit site" CTA.
  useEffect(() => {
    const timer = setTimeout(() => setShowVisitLink(true), AUTO_REDIRECT_MS);
    return () => clearTimeout(timer);
  }, []);

  function handleVisitKarma() {
    Linking.openURL(KARMA_SITE_URL);
  }

  // FR-RESEARCH-004 placement 1 — primary share CTA
  const handleShare = useCallback(async () => {
    const origin =
      globalThis.window?.location?.origin
      ?? (process.env.EXPO_PUBLIC_WEB_BASE_URL as string | undefined)
      ?? '';

    const outcome = await shareResearchSurvey({
      webBaseUrl: origin,
      src: RESEARCH_SHARE_SRC_THANKS,
      title: t('research.share.shareTitle'),
      message: t('research.share.shareMessage'),
    });

    track('research_share_initiated', {
      slug: 'alt-platforms-research',
      src: RESEARCH_SHARE_SRC_THANKS,
      outcome: outcome.kind,
    });

    if (outcome.kind !== 'dismissed') {
      setShareStatus(outcome.kind);
      setTimeout(() => setShareStatus(null), 2200);
    }
  }, [t]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={styles.heading}>{t('research.thanksHeading')}</Text>
        <Text style={styles.line}>{t('research.thanksLine1')}</Text>

        {/* Email opt-in note — V1 informational only; contact captured at Q11 */}
        <View style={styles.optInNote}>
          <Text style={styles.optInLabel}>{t('research.thanksEmailOptInLabel')}</Text>
          <Text style={styles.optInHint}>{t('research.thanksEmailPlaceholder')}</Text>
        </View>

        {/* FR-RESEARCH-004 placement 1 — primary share CTA */}
        <Pressable
          style={styles.shareBtn}
          onPress={handleShare}
          accessibilityRole="button"
        >
          <Text style={styles.shareBtnText}>{t('research.share.thanksTitle')}</Text>
        </Pressable>
        <Text style={styles.shareHelp}>{t('research.share.thanksHelp')}</Text>

        {shareStatus && (
          <Text
            style={[
              styles.shareStatus,
              shareStatus === 'failed' && styles.shareStatusError,
            ]}
          >
            {shareStatus === 'shared' && t('research.share.statusShared')}
            {shareStatus === 'copied' && t('research.share.statusCopied')}
            {shareStatus === 'failed' && t('research.share.statusFailed')}
          </Text>
        )}

        {showVisitLink ? (
          <Pressable
            style={styles.visitBtn}
            onPress={handleVisitKarma}
            accessibilityRole="link"
          >
            <Text style={styles.visitBtnText}>{t('research.thanksVisitCta')}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    direction: 'rtl' as never,
    ...webViewRtl,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 16,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'center',
    ...webViewRtl,
  },
  heading: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
    ...webTextRtl,
  },
  line: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: rtlTextAlignStart,
    lineHeight: 24,
    ...webTextRtl,
  },
  optInNote: {
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...webViewRtl,
  },
  optInLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: rtlTextAlignStart,
    ...webTextRtl,
  },
  optInHint: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: rtlTextAlignStart,
    ...webTextRtl,
  },
  visitBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  visitBtnText: {
    ...typography.button,
    color: colors.textInverse,
    ...webTextRtl,
  },
  // FR-RESEARCH-004 placement 1 — primary share CTA
  shareBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  shareBtnText: {
    ...typography.button,
    color: colors.textInverse,
    fontWeight: '700',
    ...webTextRtl,
  },
  shareHelp: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: rtlTextAlignStart,
    marginTop: spacing.xs,
    ...webTextRtl,
  },
  shareStatus: {
    ...typography.bodySmall,
    color: colors.primary,
    textAlign: rtlTextAlignStart,
    marginTop: spacing.xs,
    ...webTextRtl,
  },
  shareStatusError: {
    color: colors.error,
  },
}));
