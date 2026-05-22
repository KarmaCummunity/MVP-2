import React from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, typography, spacing, radius } from '@kc/ui';
import { aboutRtlText } from './aboutWebRtlStyle';
import { AvatarInitials } from '../../components/AvatarInitials';
import { useAboutTeamMembers } from '../../hooks/useAboutTeamMembers';

interface TeamRoleCopy {
  readonly role: string;
  readonly bio: string;
}

const AVATAR = 56;

function resolveRoleCopy(
  roles: Record<string, TeamRoleCopy>,
  roleKey: string,
): TeamRoleCopy | null {
  const copy = roles[roleKey];
  if (!copy || typeof copy !== 'object') return null;
  return copy;
}

export function AboutMissionTeamSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useAboutMissionTeamSectionStyles();
  const { members, loading, error, refetch } = useAboutTeamMembers();
  const roleCopy = t('aboutContent.teamRoles', { returnObjects: true }) as Record<string, TeamRoleCopy>;

  const visibleMembers = members
    .map((member) => {
      const copy = resolveRoleCopy(roleCopy, member.roleKey);
      if (!copy) return null;
      return { member, copy };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  return (
    <View>
      <Text style={styles.h}>{t('aboutContent.missionTeamTitle')}</Text>
      <Text style={styles.intro}>{t('aboutContent.missionTeamIntro')}</Text>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator />
        </View>
      ) : null}

      {!loading && error ? (
        <Pressable onPress={() => { refetch(); }} style={styles.errorBox}>
          <Text style={styles.errorText}>{t('aboutContent.teamLoadError')}</Text>
          <Text style={styles.errorRetry}>{t('general.retry')}</Text>
        </Pressable>
      ) : null}

      {!loading && !error && visibleMembers.length > 0 ? (
        <View style={styles.list}>
          {visibleMembers.map(({ member, copy }) => (
            <Pressable
              key={member.roleKey}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => router.push(`/user/${member.shareHandle}`)}
              accessibilityRole="button"
              accessibilityLabel={`${member.displayName} — ${copy.role}`}
            >
              <View style={styles.row}>
                <AvatarInitials name={member.displayName} avatarUrl={member.avatarUrl} size={AVATAR} />
                <View style={styles.meta}>
                  <Text style={styles.name}>{member.displayName}</Text>
                  <Text style={styles.role}>{copy.role}</Text>
                </View>
              </View>
              <Text style={styles.bio}>{copy.bio}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.ctaBox}>
        <Text style={styles.ctaH}>{t('aboutContent.teamPartnerCtaTitle')}</Text>
        <Text style={styles.ctaP}>{t('aboutContent.teamPartnerCtaBody')}</Text>
      </View>
    </View>
  );
}

const useAboutMissionTeamSectionStyles = makeUseStyles(({ colors }) => ({
  h: { ...typography.h4, color: colors.textPrimary, ...aboutRtlText, marginBottom: spacing.sm },
  intro: { ...typography.body, color: colors.textSecondary, ...aboutRtlText, lineHeight: 24, marginBottom: spacing.lg },
  loadingRow: { alignItems: 'center', paddingVertical: spacing.lg },
  errorBox: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.error,
    gap: spacing.xs,
  },
  errorText: { ...typography.caption, color: colors.textSecondary, ...aboutRtlText, lineHeight: 20 },
  errorRetry: { ...typography.label, color: colors.primary, ...aboutRtlText, fontWeight: '700' },
  list: { gap: spacing.md },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    backgroundColor: colors.surfaceRaised,
  },
  cardPressed: {
    opacity: 0.85,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  meta: { flex: 1, gap: 2 },
  name: { ...typography.h4, color: colors.textPrimary, ...aboutRtlText },
  role: { ...typography.body, color: colors.primary, ...aboutRtlText, fontWeight: '700' },
  bio: { ...typography.body, color: colors.textSecondary, ...aboutRtlText, lineHeight: 22 },
  ctaBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.infoLight,
    borderWidth: 1,
    borderColor: colors.info,
    gap: spacing.xs,
  },
  ctaH: { ...typography.label, color: colors.textPrimary, ...aboutRtlText, fontWeight: '800' },
  ctaP: { ...typography.caption, color: colors.textSecondary, ...aboutRtlText, lineHeight: 20 },
}));
