// Settings → notifications screen — FR-NOTIF-014, FR-SETTINGS-005.
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Linking,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import type { NotificationPreferences } from '@kc/domain';
import { NotificationToggleRow } from '../../src/components/NotificationToggleRow';
import { useAuthStore } from '../../src/store/authStore';
import { container } from '../../src/lib/container';

type PermStatus = 'granted' | 'denied' | 'undetermined';

const DEFAULT_PREFS: NotificationPreferences = { critical: true, social: true };

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.session?.userId);
  const qc = useQueryClient();
  const [permStatus, setPermStatus] = useState<PermStatus>('undetermined');

  useEffect(() => {
    void Notifications.getPermissionsAsync().then((p) =>
      setPermStatus(p.status as PermStatus),
    );
  }, []);

  const queryKey = ['notification-preferences', userId] as const;

  const prefsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const user = await container.userRepo.findById(userId!);
      return user?.notificationPreferences ?? DEFAULT_PREFS;
    },
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: (partial: { critical?: boolean; social?: boolean }) =>
      container.updateNotificationPreferences.execute({
        userId: userId!,
        ...partial,
      }),
    onMutate: async (partial) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<NotificationPreferences>(queryKey);
      qc.setQueryData<NotificationPreferences>(queryKey, (old) => ({
        ...(old ?? DEFAULT_PREFS),
        ...partial,
      }));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  const prefs = prefsQuery.data ?? DEFAULT_PREFS;

  return (
    <>
      <Stack.Screen options={{ title: t('notifications.settingsTitle') }} />
      <ScrollView>
        <NotificationToggleRow
          label={t('notifications.criticalLabel')}
          caption={t('notifications.criticalCaption')}
          value={prefs.critical}
          onValueChange={(v) => mutation.mutate({ critical: v })}
        />
        <NotificationToggleRow
          label={t('notifications.socialLabel')}
          caption={t('notifications.socialCaption')}
          value={prefs.social}
          onValueChange={(v) => mutation.mutate({ social: v })}
        />

        <Text style={styles.sectionHeader}>
          {t('notifications.deviceStatusSection')}
        </Text>
        <View style={styles.statusRow}>
          <Text>
            {permStatus === 'granted'
              ? t('notifications.permissionGranted')
              : t('notifications.permissionDenied')}
          </Text>
          {permStatus === 'denied' && (
            <Pressable
              onPress={() => void Linking.openSettings()}
              style={styles.button}
            >
              <Text style={styles.buttonText}>
                {t('notifications.openOsSettings')}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 13,
    color: '#888',
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlign: 'right',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0A8754',
    borderRadius: 6,
  },
  buttonText: { color: 'white', fontSize: 14 },
});
