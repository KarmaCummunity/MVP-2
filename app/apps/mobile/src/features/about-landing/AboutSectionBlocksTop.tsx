import React from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { colors, typography, spacing, radius } from '@kc/ui';
import { useTranslation } from 'react-i18next';
import { AnimatedEntry } from '../../components/animations/AnimatedEntry';
import type { AboutSectionId } from './aboutSectionModel';

const gap = spacing.lg;

function SectionCard({
  children,
  style,
}: Readonly<{ children: React.ReactNode; style?: object }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function track(
  id: AboutSectionId,
  onY: (section: AboutSectionId, y: number) => void,
): (e: LayoutChangeEvent) => void {
  return (e) => onY(id, e.nativeEvent.layout.y);
}

export interface AboutSectionBlocksTopProps {
  readonly onSectionY: (section: AboutSectionId, y: number) => void;
}

export function AboutSectionBlocksTop({ onSectionY }: AboutSectionBlocksTopProps) {
  const { t } = useTranslation();
  let d = 0;
  const next = () => {
    const cur = d;
    d += 40;
    return cur;
  };

  return (
    <>
      <View onLayout={track('numbers', onSectionY)} collapsable={false}>
        <AnimatedEntry delay={next()}>
          <SectionCard>
            <Text style={styles.h}>{t('aboutContent.numbersTitle')}</Text>
            <Text style={styles.lead}>{t('aboutContent.numbersLead')}</Text>
            <Text style={styles.p}>{t('aboutContent.numbersBody')}</Text>
          </SectionCard>
        </AnimatedEntry>
      </View>
      <View onLayout={track('vision', onSectionY)} collapsable={false}>
        <AnimatedEntry delay={next()}>
          <SectionCard>
            <Text style={styles.h}>{t('aboutContent.visionTitle')}</Text>
            <Text style={styles.p}>{t('aboutContent.visionText')}</Text>
          </SectionCard>
        </AnimatedEntry>
      </View>
      <View onLayout={track('problems', onSectionY)} collapsable={false}>
        <AnimatedEntry delay={next()}>
          <SectionCard>
            <Text style={styles.h}>{t('aboutContent.problemsTitle')}</Text>
            <Text style={styles.p}>{t('aboutContent.problemsText')}</Text>
          </SectionCard>
        </AnimatedEntry>
      </View>
      <View onLayout={track('features', onSectionY)} collapsable={false}>
        <AnimatedEntry delay={next()}>
          <SectionCard>
            <Text style={styles.h}>{t('aboutContent.featuresTitle')}</Text>
            <Text style={styles.p}>{t('aboutContent.featuresText')}</Text>
          </SectionCard>
        </AnimatedEntry>
      </View>
      <View onLayout={track('mission', onSectionY)} collapsable={false}>
        <AnimatedEntry delay={next()}>
          <SectionCard>
            <Text style={styles.h}>{t('aboutContent.missionTitle')}</Text>
            <Text style={styles.p}>{t('aboutContent.missionText')}</Text>
          </SectionCard>
        </AnimatedEntry>
      </View>
      <View onLayout={track('how', onSectionY)} collapsable={false}>
        <AnimatedEntry delay={next()}>
          <SectionCard>
            <Text style={styles.h}>{t('aboutContent.howItWorksTitle')}</Text>
            <Text style={styles.p}>{t('aboutContent.howItWorksText')}</Text>
          </SectionCard>
        </AnimatedEntry>
      </View>
      <View onLayout={track('audience', onSectionY)} collapsable={false}>
        <AnimatedEntry delay={next()}>
          <SectionCard>
            <Text style={styles.h}>{t('aboutContent.audienceTitle')}</Text>
            <Text style={styles.p}>{t('aboutContent.audienceText')}</Text>
          </SectionCard>
        </AnimatedEntry>
      </View>
      <View onLayout={track('values', onSectionY)} collapsable={false}>
        <AnimatedEntry delay={next()}>
          <SectionCard>
            <Text style={styles.h}>{t('aboutContent.valuesTitle')}</Text>
            <Text style={styles.p}>{t('aboutContent.valuesText')}</Text>
          </SectionCard>
        </AnimatedEntry>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  h: { ...typography.h4, color: colors.textPrimary, textAlign: 'right', marginBottom: spacing.sm },
  lead: { ...typography.body, fontWeight: '600', color: colors.textPrimary, textAlign: 'right', marginBottom: spacing.sm },
  p: { ...typography.body, color: colors.textSecondary, textAlign: 'right', lineHeight: 24 },
});
