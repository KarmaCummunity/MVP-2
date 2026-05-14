import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import type { PushData } from '@kc/domain';

function handleNotificationTap(data: Partial<PushData>): void {
  if (!data?.route) return;
  router.push({ pathname: data.route as never, params: data.params ?? {} });
}

export function useNotificationTapRouting(): void {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationTap(
        response.notification.request.content.data as Partial<PushData>,
      );
    });
    // Cold-start: there may be a tap that opened the app.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationTap(
          response.notification.request.content.data as Partial<PushData>,
        );
      }
    });
    return () => sub.remove();
  }, []);
}
