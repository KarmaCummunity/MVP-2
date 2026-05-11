// FeedFilterIcon — the filter/sort entry-point that lives in the TopBar
// only while the Home Feed is active. Tag with the active-filter count when
// >0 (FR-FEED-004 / replaces the deprecated FR-FEED-013 in-feed chip).

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@kc/ui';

interface FeedFilterIconProps {
  activeCount: number;
  onPress: () => void;
}

export function FeedFilterIcon({ activeCount, onPress }: FeedFilterIconProps) {
  const display = activeCount > 9 ? '9+' : String(activeCount);
  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={onPress}
      accessibilityLabel="סינון ומיון פוסטים"
      accessibilityHint="פותח חלון לסינון ולמיון של הפיד"
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

const styles = StyleSheet.create({
  btn: { padding: spacing.xs, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: colors.textInverse, fontWeight: '700' as const, fontSize: 10 },
});
