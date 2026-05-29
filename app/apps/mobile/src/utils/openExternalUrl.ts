import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { assertSafeExternalUrl } from './assertSafeExternalUrl';

const WEB_WINDOW_NAME = '_kc_external';

export function openExternalUrl(url: string): void {
  const safe = assertSafeExternalUrl(url);
  if (Platform.OS === 'web') {
    const w = globalThis.window;
    if (typeof w !== 'undefined') {
      w.open(safe, WEB_WINDOW_NAME);
      return;
    }
  }
  void WebBrowser.openBrowserAsync(safe);
}
