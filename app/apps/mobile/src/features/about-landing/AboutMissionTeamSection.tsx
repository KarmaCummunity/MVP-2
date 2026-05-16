import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, radius } from '@kc/ui';

interface TeamMember {
  readonly name: string;
  readonly role: string;
  readonly bio: string;
  readonly initials: string;
  readonly placeholder?: boolean;
}

const AVATAR = 56;

export function AboutMissionTeamSection() {
  const { t } = useTranslation();
  const members = t('aboutContent.teamMembers', { returnObjects: true }) as TeamMember[];

  return (
    <View>
      <Text style={styles.h}>{t('aboutContent.missionTeamTitle')}</Text>
      <Text style={styles.intro}>{t('aboutContent.missionTeamIntro')}</Text>

      <View style={styles.list}>
        {members.map((m, i) => (
          <View key={`${m.name}-${i}`} style={[styles.card, m.placeholder && styles.cardGhost]}>
            <View style={styles.row}>
              <View style={[styles.avatar, m.placeholder && styles.avatarGhost]}>
                <Text style={[styles.avatarText, m.placeholder && styles.avatarTextGhost]}>{m.initials}</Text>
              </View>
              <View style={styles.meta}>
                <Text style={styles.name}>{m.name}</Text>
                <Text style={styles.role}>{m.role}</Text>
              </View>
            </View>
            {m.placeholder ? (
              <View style={styles.phBody}>
                <Text style={styles.phTitle}>{t('aboutContent.teamPlaceholderTitle')}</Text>
                <Text style={styles.phText}>{t('aboutContent.teamPlaceholderBody')}</Text>
              </View>
            ) : (
              <Text style={styles.bio}>{m.bio}</Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.ctaBox}>
        <Text style={styles.ctaH}>{t('aboutContent.teamPartnerCtaTitle')}</Text>
        <Text style={styles.ctaP}>{t('aboutContent.teamPartnerCtaBody')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  h: { ...typography.h4, color: colors.textPrimary, textAlign: 'right', marginBottom: spacing.sm },
  intro: { ...typography.body, color: colors.textSecondary, textAlign: 'right', lineHeight: 24, marginBottom: spacing.lg },
  list: { gap: spacing.md },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    backgroundColor: colors.surfaceRaised,
  },
  cardGhost: {
    borderStyle: 'dashed',
    backgroundColor: colors.primarySurface,
    borderColor: colors.primaryLight,
  },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGhost: { backgroundColor: colors.secondaryLight, borderWidth: 1, borderColor: colors.secondary },
  avatarText: { ...typography.h4, color: colors.textInverse, fontWeight: '800' },
  avatarTextGhost: { color: colors.secondary, fontSize: 22 },
  meta: { flex: 1, gap: 2 },
  name: { ...typography.h4, color: colors.textPrimary, textAlign: 'right' },
  role: { ...typography.body, color: colors.primary, textAlign: 'right', fontWeight: '700' },
  bio: { ...typography.body, color: colors.textSecondary, textAlign: 'right', lineHeight: 22 },
  phBody: { gap: spacing.xs },
  phTitle: { ...typography.label, color: colors.textSecondary, textAlign: 'right', fontWeight: '700' },
  phText: { ...typography.caption, color: colors.textDisabled, textAlign: 'right', lineHeight: 18 },
  ctaBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.infoLight,
    borderWidth: 1,
    borderColor: colors.info,
    gap: spacing.xs,
  },
  ctaH: { ...typography.label, color: colors.textPrimary, textAlign: 'right', fontWeight: '800' },
  ctaP: { ...typography.caption, color: colors.textSecondary, textAlign: 'right', lineHeight: 20 },
});
