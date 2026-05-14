import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';

let installed = false;

export function installBadgeAutoClear(): void {
  if (installed) return;
  installed = true;
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      Notifications.setBadgeCountAsync(0).catch(() => undefined);
    }
  });
}
