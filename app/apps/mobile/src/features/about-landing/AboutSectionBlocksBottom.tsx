import React from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '@kc/ui';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedEntry } from '../../components/animations/AnimatedEntry';
import type { AboutSectionId } from './aboutSectionModel';
import { AboutInstagramEmbed } from './AboutInstagramEmbed';

function track(
  id: AboutSectionId,
  onY: (section: AboutSectionId, y: number) => void,
): (e: LayoutChangeEvent) => void {
  return (e) => onY(id, e.nativeEvent.layout.y);
}

export interface AboutSectionBlocksBottomProps {
  readonly onSectionY: (section: AboutSectionId, y: number) => void;
  readonly delayStart: number;
}

export function AboutSectionBlocksBottom({ onSectionY, delayStart }: AboutSectionBlocksBottomProps) {
  const { t } = useTranslation();
  const router = useRouter();
  let d = delayStart;
  const next = () => {
    const cur = d;
    d += 40;
    return cur;
  };

  return (
    <>
      <View onLayout={track('roadmap', onSectionY)} collapsable={false}>
        <AnimatedEntry delay={next()}>
          <View style={styles.card}>
            <Text style={styles.h}>{t('aboutContent.roadmapTitle')}</Text>
            <Text style={styles.sub}>{t('aboutContent.roadmapPhase1Title')}</Text>
            <Text style={styles.p}>{t('aboutContent.roadmapPhase1Body')}</Text>
            <Text style={styles.sub}>{t('aboutContent.roadmapPhase2Title')}</Text>
            <Text style={styles.p}>{t('aboutContent.roadmapPhase2Body')}</Text>
            <Text style={styles.sub}>{t('aboutContent.roadmapPhase3Title')}</Text>
            <Text style={styles.p}>{t('aboutContent.roadmapPhase3Body')}</Text>
            <Text style={styles.sub}>{t('aboutContent.roadmapPhase4Title')}</Text>
            <Text style={styles.p}>{t('aboutContent.roadmapPhase4Body')}</Text>
          </View>
        </AnimatedEntry>
      </View>
      <View onLayout={track('goals', onSectionY)} collapsable={false}>
        <AnimatedEntry delay={next()}>
          <View style={styles.card}>
            <Text style={styles.h}>{t('aboutContent.goalsTitle')}</Text>
            <Text style={styles.p}>{t('aboutContent.goalsText')}</Text>
          </View>
        </AnimatedEntry>
      </View>
      <View onLayout={track('contributions', onSectionY)} collapsable={false}>
        <AnimatedEntry delay={next()}>
          <View style={styles.card}>
            <Text style={styles.h}>{t('aboutContent.contributionsTitle')}</Text>
            <Text style={styles.p}>{t('aboutContent.contributionsText')}</Text>
          </View>
        </AnimatedEntry>
      </View>
      <View onLayout={track('team', onSectionY)} collapsable={false}>
        <AnimatedEntry delay={next()}>
          <View style={styles.card}>
            <Text style={styles.h}>{t('aboutContent.teamTitle')}</Text>
            <Text style={styles.sub}>{t('aboutContent.teamLeadTitle')}</Text>
            <Text style={styles.p}>{t('aboutContent.teamLeadBio')}</Text>
          </View>
        </AnimatedEntry>
      </View>
      <View onLayout={track('instagram', onSectionY)} collapsable={false}>
        <AnimatedEntry delay={next()}>
          <View style={styles.card}>
            <AboutInstagramEmbed
              title={t('aboutContent.instagramTitle')}
              caption={t('aboutContent.instagramCaption')}
              openLabel={t('aboutContent.instagramOpen')}
              embedNote={t('aboutContent.instagramEmbedNote')}
            />
          </View>
        </AnimatedEntry>
      </View>
      <View onLayout={track('faq', onSectionY)} collapsable={false}>
        <AnimatedEntry delay={next()}>
          <View style={styles.card}>
            <Text style={styles.h}>{t('aboutContent.navFaq')}</Text>
            <View style={styles.faqItem}>
              <Text style={styles.q}>{t('aboutContent.faq1Q')}</Text>
              <Text style={styles.p}>{t('aboutContent.faq1A')}</Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.q}>{t('aboutContent.faq2Q')}</Text>
              <Text style={styles.p}>{t('aboutContent.faq2A')}</Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.q}>{t('aboutContent.faq3Q')}</Text>
              <Text style={styles.p}>{t('aboutContent.faq3A')}</Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.q}>{t('aboutContent.faq4Q')}</Text>
              <Text style={styles.p}>{t('aboutContent.faq4A')}</Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.q}>{t('aboutContent.faq5Q')}</Text>
              <Text style={styles.p}>{t('aboutContent.faq5A')}</Text>
            </View>
          </View>
        </AnimatedEntry>
      </View>
      <View onLayout={track('contact', onSectionY)} collapsable={false}>
        <AnimatedEntry delay={next()}>
          <View style={styles.card}>
            <Text style={styles.h}>{t('aboutContent.contactTitle')}</Text>
            <Text style={styles.p}>{t('aboutContent.contactText')}</Text>
            <TouchableOpacity
              style={styles.cta}
              onPress={() => router.push('/settings/report-issue')}
            >
              <Ionicons name="chatbubbles-outline" size={20} color={colors.textInverse} />
              <Text style={styles.ctaText}>{t('aboutContent.contactCta')}</Text>
            </TouchableOpacity>
          </View>
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
  h: { ...typography.h4, color: colors.textPrimary, textAlign: 'right', marginBottom: spacing.md },
  sub: {
    ...typography.label,
    color: colors.primary,
    textAlign: 'right',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  p: { ...typography.body, color: colors.textSecondary, textAlign: 'right', lineHeight: 24 },
  faqItem: { marginBottom: spacing.lg },
  q: { ...typography.body, fontWeight: '600', color: colors.textPrimary, textAlign: 'right', marginBottom: spacing.xs },
  cta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  ctaText: { ...typography.button, color: colors.textInverse },
});
