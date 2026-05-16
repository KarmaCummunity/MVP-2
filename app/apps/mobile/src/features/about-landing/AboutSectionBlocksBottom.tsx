import React from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '@kc/ui';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedEntry } from '../../components/animations/AnimatedEntry';
import type { AboutSectionId } from './aboutSectionModel';
import { AboutInstagramEmbed } from './AboutInstagramEmbed';
import { AboutRoadmapTimeline } from './AboutRoadmapTimeline';
import { AboutContributionsGrid } from './AboutContributionsGrid';
import { AboutFaqAccordion } from './AboutFaqAccordion';

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
            <View style={styles.spacer} />
            <AboutRoadmapTimeline />
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
            <View style={styles.spacer} />
            <AboutContributionsGrid />
          </View>
        </AnimatedEntry>
      </View>

      <View onLayout={track('team', onSectionY)} collapsable={false}>
        <AnimatedEntry delay={next()}>
          <View style={styles.card}>
            <Text style={styles.h}>{t('aboutContent.teamTitle')}</Text>
            <View style={styles.teamRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{t('aboutContent.teamLeadInitials')}</Text>
              </View>
              <View style={styles.teamMeta}>
                <Text style={styles.teamName}>{t('aboutContent.teamLeadName')}</Text>
                <Text style={styles.teamRole}>{t('aboutContent.teamLeadRole')}</Text>
              </View>
            </View>
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
            <View style={styles.spacer} />
            <AboutFaqAccordion />
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

const AVATAR = 56;
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  h: { ...typography.h4, color: colors.textPrimary, textAlign: 'right', marginBottom: spacing.md },
  p: { ...typography.body, color: colors.textSecondary, textAlign: 'right', lineHeight: 24 },
  spacer: { height: spacing.sm },
  teamRow: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.h4, color: colors.textInverse, fontWeight: '700' },
  teamMeta: { flex: 1, gap: 2 },
  teamName: { ...typography.h4, color: colors.textPrimary, textAlign: 'right' },
  teamRole: { ...typography.body, color: colors.primary, textAlign: 'right', fontWeight: '600' },
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
