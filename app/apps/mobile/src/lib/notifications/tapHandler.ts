import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import type { PushData } from '@kc/domain';

function handleNotificationTap(data: Partial<PushData>): void {
  if (!data?.route) return;
  router.push({ pathname: data.route as never, params: data.params ?? {} });
}

export function useNotificationTapRouting(): void {
  useEffect(() => {
    if (Platform.OS === 'web') {
      return undefined;
    }
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationTap(
        response.notification.request.content.data as Partial<PushData>,
      );
    });
    // Cold-start: there may be a tap that opened the app (native only).
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationTap(
          response.notification.request.content.data as Partial<PushData>,
        );
      }
    });
    return () => sub.remove();
  }, []);
}
