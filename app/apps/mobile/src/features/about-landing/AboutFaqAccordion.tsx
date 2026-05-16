// FAQ accordion with Reanimated expand/collapse + chevron rotation.
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@kc/ui';
import { MOTION } from '../../lib/animations/motion';

interface FaqItem {
  readonly q: string;
  readonly a: string;
}

interface RowProps {
  readonly item: FaqItem;
  readonly isLast: boolean;
}

function FaqRow({ item, isLast }: RowProps) {
  const [open, setOpen] = useState(false);
  const rot = useSharedValue(0);
  const opacity = useSharedValue(0);

  const toggle = useCallback(() => {
    const next = !open;
    setOpen(next);
    rot.value = withTiming(next ? 1 : 0, { duration: MOTION.duration.fast });
    opacity.value = withTiming(next ? 1 : 0, { duration: MOTION.duration.base });
  }, [open, rot, opacity]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value * 180}deg` }],
  }));
  const answerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <TouchableOpacity style={styles.question} onPress={toggle} activeOpacity={0.7}>
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-down" size={20} color={colors.primary} />
        </Animated.View>
        <Text style={styles.q}>{item.q}</Text>
      </TouchableOpacity>
      {open && (
        <Animated.View style={[styles.answer, answerStyle]}>
          <Text style={styles.a}>{item.a}</Text>
        </Animated.View>
      )}
    </View>
  );
}

export function AboutFaqAccordion() {
  const { t } = useTranslation();
  const items: FaqItem[] = t('aboutContent.faqItems', { returnObjects: true }) as FaqItem[];

  return (
    <View style={styles.list}>
      {items.map((it, i) => (
        <FaqRow key={it.q} item={it} isLast={i === items.length - 1} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  row: { paddingHorizontal: spacing.md },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  question: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  q: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
    fontWeight: '600',
  },
  answer: { paddingBottom: spacing.md },
  a: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: 22,
  },
});
