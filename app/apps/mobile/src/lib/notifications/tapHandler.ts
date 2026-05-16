import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import type { PushData } from '@kc/domain';
import { resolvePushRoute } from './pushRouteAllowlist';

function handleNotificationTap(data: Partial<PushData>): void {
  // TD-102 (BACKLOG P2.14): never feed data.route into router.push. The
  // route is derived from data.kind against a closed allow-list; rejected
  // payloads are dropped silently rather than redirected.
  const resolved = resolvePushRoute(data);
  if (!resolved) return;
  router.push({ pathname: resolved.pathname as never, params: resolved.params });
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
