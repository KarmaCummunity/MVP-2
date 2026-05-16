// FeedCommunityCounter — small text counter rendered via a caller-supplied
// `template(count)` function so the i18n key lives at the call site (guest
// banner, warm empty state). Mapped to FR-FEED-014 + FR-AUTH-014 AC3.
// Fetched on mount, refreshed every 60 seconds per FR-FEED-014.

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, typography } from '@kc/ui';
import { useActivePostsCount } from '../hooks/useActivePostsCount';

interface FeedCommunityCounterProps {
  template: (count: number) => string;
  style?: React.ComponentProps<typeof Text>['style'];
}

export function FeedCommunityCounter({ template, style }: FeedCommunityCounterProps) {
  const count = useActivePostsCount();
  if (count === undefined) return null;
  return <Text style={[styles.text, style]}>{template(count)}</Text>;
}

const styles = StyleSheet.create({
  text: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
