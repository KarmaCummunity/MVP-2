import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, typography, spacing, radius } from '@kc/ui';
import { aboutRtlText } from './aboutWebRtlStyle';

/**
 * About — Governance section (v1.0 §10). Three-stage constitution:
 * today (founder) → amuta (iron bylaws + board) → far future (democratic voting).
 */
export function AboutGovernanceSection() {
  const { t } = useTranslation();
  const styles = useStyles();

  return (
    <View>
      <Text style={styles.h}>{t('aboutContent.governanceTitle')}</Text>
      <Text style={styles.lead}>{t('aboutContent.governanceLead')}</Text>

      <View style={styles.stageList}>
        <Stage
          phase="היום"
          title={t('aboutContent.governanceTodayTitle')}
          body={t('aboutContent.governanceTodayBody')}
          tone="current"
        />
        <Stage
          phase="בקרוב"
          title={t('aboutContent.governanceAmutaTitle')}
          body={t('aboutContent.governanceAmutaBody')}
          tone="soon"
        />
        <Stage
          phase="בעתיד"
          title={t('aboutContent.governanceFutureTitle')}
          body={t('aboutContent.governanceFutureBody')}
          tone="future"
        />
      </View>
    </View>
  );
}

interface StageProps {
  readonly phase: string;
  readonly title: string;
  readonly body: string;
  readonly tone: 'current' | 'soon' | 'future';
}

function Stage({ phase, title, body, tone }: StageProps) {
  const styles = useStyles();
  const toneStyle =
    tone === 'current' ? styles.toneCurrent : tone === 'soon' ? styles.toneSoon : styles.toneFuture;
  return (
    <View style={[styles.stage, toneStyle]}>
      <Text style={styles.stagePhase}>{phase}</Text>
      <Text style={styles.stageTitle}>{title}</Text>
      <Text style={styles.stageBody}>{body}</Text>
    </View>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  h: { ...typography.h4, color: colors.textPrimary, ...aboutRtlText, marginBottom: spacing.xs },
  lead: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
    ...aboutRtlText,
    marginBottom: spacing.md,
  },
  stageList: { gap: spacing.sm },
  stage: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  toneCurrent: { backgroundColor: colors.successLight, borderColor: colors.success },
  toneSoon: { backgroundColor: colors.infoLight, borderColor: colors.info },
  toneFuture: { backgroundColor: colors.warningLight, borderColor: colors.warning },
  stagePhase: {
    ...typography.label,
    fontWeight: '800',
    color: colors.textPrimary,
    ...aboutRtlText,
  },
  stageTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
    ...aboutRtlText,
  },
  stageBody: {
    ...typography.body,
    color: colors.textSecondary,
    ...aboutRtlText,
    lineHeight: 22,
  },
}));
