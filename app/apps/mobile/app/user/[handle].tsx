// Other user's profile — placeholder until IUserRepository.findByHandle ships (P2.4 / TD-40).
// P0.4-FE retired the mock-data shortcut; full lookup arrives with the user adapter.
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../src/components/EmptyState';
import { colors } from '@kc/ui';

export default function UserProfileScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <EmptyState
        emoji="👤"
        title="פרופיל ציבורי"
        subtitle={`@${handle ?? '—'} · התצוגה המלאה תיתמך לאחר השלמת מאגר המשתמשים (P2.4).`}
      />
    </SafeAreaView>
  );
}
