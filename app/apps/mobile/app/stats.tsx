import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@kc/ui';

// Mapped to PRD §3.6

function StatCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <View style={[styles.card, { borderTopColor: color, borderTopWidth: 4 }]}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  // Mock data for the MVP as per PRD
  const personalStats = {
    given: 12,
    received: 4,
    active: 2,
  };

  const communityStats = {
    users: 1542,
    posts: 320,
    delivered: 890,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('stats.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.cardsGrid}>
          <StatCard title={t('stats.given')} value={personalStats.given} color={colors.success} />
          <StatCard title={t('stats.received')} value={personalStats.received} color={colors.info} />
          <StatCard title={t('stats.activePosts')} value={personalStats.active} color={colors.primary} />
        </View>

        <Text style={styles.sectionTitle}>{t('stats.recentActivity')}</Text>
        <View style={styles.timeline}>
          {/* Simple mock timeline */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineText}>מסרת חולצות קיץ לשמעון</Text>
              <Text style={styles.timelineTime}>אתמול</Text>
            </View>
          </View>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineText}>יצרת פוסט ״אופניים״</Text>
              <Text style={styles.timelineTime}>לפני 3 ימים</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('stats.communityTitle')}</Text>
        <View style={styles.communityBox}>
          <View style={styles.communityRow}>
            <Text style={styles.communityLabel}>{t('stats.communityUsers')}</Text>
            <Text style={styles.communityValue}>{communityStats.users}</Text>
          </View>
          <View style={styles.communityRow}>
            <Text style={styles.communityLabel}>{t('stats.communityPosts')}</Text>
            <Text style={styles.communityValue}>{communityStats.posts}</Text>
          </View>
          <View style={styles.communityRow}>
            <Text style={styles.communityLabel}>{t('stats.communityDelivered')}</Text>
            <Text style={styles.communityValue}>{communityStats.delivered}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { ...typography.h3, color: colors.textPrimary },
  scroll: { padding: spacing.base, gap: spacing.lg, paddingBottom: spacing['3xl'] },
  cardsGrid: {
    gap: spacing.base,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardValue: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.xs },
  cardTitle: { ...typography.body, color: colors.textSecondary },
  sectionTitle: { ...typography.h4, color: colors.textPrimary, textAlign: 'right' },
  timeline: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.base,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.base,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginLeft: spacing.sm,
  },
  timelineContent: {
    flex: 1,
  },
  timelineText: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  timelineTime: { ...typography.caption, color: colors.textDisabled, textAlign: 'right' },
  communityBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  communityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.xs,
  },
  communityLabel: { ...typography.body, color: colors.textSecondary },
  communityValue: { ...typography.h4, color: colors.textPrimary },
});
