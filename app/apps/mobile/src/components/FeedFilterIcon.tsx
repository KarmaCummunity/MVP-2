// FeedFilterIcon — the filter/sort entry-point that lives in the TopBar
// only while the Home Feed is active. Tag with the active-filter count when
// >0 (FR-FEED-004 / replaces the deprecated FR-FEED-013 in-feed chip).

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, spacing, useTheme } from '@kc/ui';

interface FeedFilterIconProps {
  activeCount: number;
  onPress: () => void;
}

export function FeedFilterIcon({ activeCount, onPress }: FeedFilterIconProps) {
  const styles = useFeedFilterIconStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const display = activeCount > 9 ? '9+' : String(activeCount);
  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={onPress}
      accessibilityLabel={t('feed.filterA11y')}
      accessibilityHint={t('feed.filterA11yHint')}
    >
      <Ionicons name="options-outline" size={24} color={colors.textPrimary} />
      {activeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{display}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const useFeedFilterIconStyles = makeUseStyles(({ colors }) => ({
  btn: { padding: spacing.xs, position: 'relative' as const },
  badge: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  badgeText: { color: colors.textInverse, fontWeight: '700' as const, fontSize: 10 },
}));
