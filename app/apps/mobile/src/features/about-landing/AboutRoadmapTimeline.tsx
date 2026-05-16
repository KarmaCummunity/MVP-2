// Vertical numbered timeline for the About roadmap section.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, radius } from '@kc/ui';

type PhaseSeverity = 'current' | 'soon' | 'future' | 'long-term';

interface Phase {
  readonly label: string;
  readonly severity: PhaseSeverity;
  readonly status: string;
  readonly title: string;
  readonly body: string;
}

const SEVERITY_COLOR: Record<PhaseSeverity, string> = {
  current: colors.primary,
  soon: colors.warning ?? '#F59E0B',
  future: colors.textSecondary,
  'long-term': colors.textDisabled,
};

export function AboutRoadmapTimeline() {
  const { t } = useTranslation();
  const phases: Phase[] = t('aboutContent.roadmapPhases', { returnObjects: true }) as Phase[];

  return (
    <View style={styles.wrap}>
      {phases.map((p, i) => {
        const isLast = i === phases.length - 1;
        const dot = SEVERITY_COLOR[p.severity] ?? colors.textSecondary;
        return (
          <View key={p.label} style={styles.row}>
            <View style={styles.timeline}>
              <View style={[styles.dot, { backgroundColor: dot }]}>
                <Text style={styles.dotNum}>{i + 1}</Text>
              </View>
              {!isLast && <View style={styles.line} />}
            </View>
            <View style={styles.content}>
              <View style={styles.headerRow}>
                <View style={[styles.statusBadge, { backgroundColor: dot }]}>
                  <Text style={styles.statusText}>{p.status}</Text>
                </View>
                <Text style={styles.label}>{p.label}</Text>
              </View>
              <Text style={styles.title}>{p.title}</Text>
              <Text style={styles.body}>{p.body}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const DOT = 32;
const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { flexDirection: 'row-reverse', gap: spacing.md, alignItems: 'flex-start' },
  timeline: { alignItems: 'center', width: DOT },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotNum: { ...typography.caption, color: colors.textInverse, fontWeight: '800' },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: spacing.xs, minHeight: 30 },
  content: { flex: 1, paddingBottom: spacing.lg, gap: spacing.xs },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusText: { ...typography.caption, color: colors.textInverse, fontWeight: '700', fontSize: 11 },
  label: { ...typography.label, color: colors.textDisabled, fontWeight: '700' },
  title: { ...typography.h4, color: colors.textPrimary, textAlign: 'right' },
  body: { ...typography.body, color: colors.textSecondary, textAlign: 'right', lineHeight: 22 },
});
