// app/apps/mobile/app/settings/privacy.tsx
// FR-PROFILE-005 / FR-PROFILE-006: Public ↔ Private toggle + follow-requests entry.

import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing, typography } from '@kc/ui';
import { useAuthStore } from '../../src/store/authStore';
import { ConfirmActionModal } from '../../src/components/post/ConfirmActionModal';
import { getUserRepo } from '../../src/services/userComposition';
import {
  getUpdatePrivacyModeUseCase,
  getListPendingFollowRequestsUseCase,
} from '../../src/services/followComposition';

export default function PrivacyScreen() {
  const router = useRouter();
  const me = useAuthStore((s) => s.session?.userId);
  const qc = useQueryClient();

  const userQuery = useQuery({
    queryKey: ['user-profile', me],
    queryFn: () => getUserRepo().findById(me!),
    enabled: Boolean(me),
  });
  const user = userQuery.data;
  const isPrivate = user?.privacyMode === 'Private';

  const pendingQuery = useQuery({
    queryKey: ['pending-requests-count', me],
    queryFn: () => getListPendingFollowRequestsUseCase().execute({ targetId: me!, limit: 50 }),
    enabled: Boolean(me && isPrivate),
  });
  const pendingCount = pendingQuery.data?.requests.length ?? 0;

  const [pendingTarget, setPendingTarget] = React.useState<'Private' | 'Public' | null>(null);
  const [busyToggle, setBusyToggle] = React.useState(false);

  const onToggle = (next: boolean) => {
    if (!me || !user) return;
    setPendingTarget(next ? 'Private' : 'Public');
  };

  const confirmToggle = async () => {
    if (!me || !pendingTarget) return;
    setBusyToggle(true);
    try {
      await getUpdatePrivacyModeUseCase().execute({ userId: me, mode: pendingTarget });
      qc.invalidateQueries({ queryKey: ['user-profile', me] });
      qc.invalidateQueries({ queryKey: ['pending-requests-count', me] });
      setPendingTarget(null);
    } catch {
      // Best-effort: close the modal and let the user retry. We don't have a
      // notify surface mounted here in MVP scope.
      setPendingTarget(null);
    } finally {
      setBusyToggle(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'פרטיות' }} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.textPrimary} />
          <View style={styles.labelWrap}>
            <Text style={styles.label}>פרופיל פרטי</Text>
            <Text style={styles.hint}>רק עוקבים מאושרים יראו את הפוסטים והעוקבים שלך.</Text>
          </View>
          <Switch value={isPrivate ?? false} onValueChange={onToggle} disabled={!user} />
        </View>

        {isPrivate ? (
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/settings/follow-requests' as never)}
          >
            <Ionicons name="people-outline" size={20} color={colors.textPrimary} />
            <Text style={[styles.label, { flex: 1 }]}>
              {`בקשות עוקבים${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
            </Text>
            <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      <ConfirmActionModal
        visible={pendingTarget !== null}
        title={pendingTarget === 'Private' ? 'להפוך את הפרופיל לפרטי?' : 'להפוך את הפרופיל לציבורי?'}
        message={pendingTarget === 'Private'
          ? 'בקשות עקיבה חדשות ידרשו אישור. עוקבים קיימים יישארו (אפשר להסיר אותם ידנית). פוסטים פתוחים יישארו פתוחים. תוכלי לפרסם פוסטים חדשים לעוקבים בלבד.'
          : 'כל הבקשות הממתינות יאושרו אוטומטית. פוסטים שפורסמו לעוקבים בלבד יישארו גלויים לכל עוקב חדש מעכשיו.'}
        confirmLabel={pendingTarget === 'Private' ? 'הפוך לפרטי' : 'הפוך לציבורי'}
        isBusy={busyToggle}
        onCancel={() => (busyToggle ? null : setPendingTarget(null))}
        onConfirm={confirmToggle}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.base, gap: spacing.sm },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  labelWrap: { flex: 1 },
  label: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  hint: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
});
