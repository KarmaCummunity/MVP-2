// FeedCommunityCounter — small text counter for "{N} פוסטים פעילים בקהילה".
// Used in the guest banner (FR-FEED-014 + FR-AUTH-014 AC3) and in the warm
// empty state. Fetched on mount, refreshed every 60 seconds per FR-FEED-014.

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, typography } from '@kc/ui';
import { getActivePostsCountUseCase } from '../services/postsComposition';

interface FeedCommunityCounterProps {
  template: (count: number) => string;
  style?: React.ComponentProps<typeof Text>['style'];
}

export function FeedCommunityCounter({ template, style }: FeedCommunityCounterProps) {
  const { data } = useQuery({
    queryKey: ['communityActivePostsCount'],
    queryFn: () => getActivePostsCountUseCase().execute(),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  if (typeof data !== 'number') return null;
  return <Text style={[styles.text, style]}>{template(data)}</Text>;
}

const styles = StyleSheet.create({
  text: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
