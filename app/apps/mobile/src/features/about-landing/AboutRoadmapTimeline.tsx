// Vertical numbered timeline for the About roadmap section — summary + per-phase expand.
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@kc/ui';

type PhaseSeverity = 'current' | 'soon' | 'future' | 'long-term';

interface Phase {
  readonly label: string;
  readonly severity: PhaseSeverity;
  readonly status: string;
  readonly title: string;
  readonly summary?: string;
  readonly body?: string;
  readonly details?: string;
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
  const [open, setOpen] = useState<Record<number, boolean>>({});

  const toggle = useCallback((i: number) => {
    if (Platform.OS !== 'web') LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => ({ ...prev, [i]: !prev[i] }));
  }, []);

  return (
    <View style={styles.wrap}>
      {phases.map((p, i) => {
        const isLast = i === phases.length - 1;
        const dot = SEVERITY_COLOR[p.severity] ?? colors.textSecondary;
        const summary = p.summary ?? p.body ?? '';
        const details = p.details ?? '';
        const expanded = !!open[i];
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
              <Text style={styles.summary}>{summary}</Text>
              {details ? (
                <>
                  <Pressable
                    style={styles.expandBtn}
                    onPress={() => toggle(i)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                  >
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.secondary} />
                    <Text style={styles.expandLabel}>{expanded ? t('aboutContent.roadmapExpandLess') : t('aboutContent.roadmapExpandMore')}</Text>
                  </Pressable>
                  {expanded ? <Text style={styles.details}>{details}</Text> : null}
                </>
              ) : null}
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
  summary: { ...typography.body, color: colors.textSecondary, textAlign: 'right', lineHeight: 22 },
  expandBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
  },
  expandLabel: { ...typography.caption, color: colors.secondary, fontWeight: '700' },
  details: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: 22,
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
});
