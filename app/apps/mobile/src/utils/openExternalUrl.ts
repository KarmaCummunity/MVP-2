// Opens an external URL without spawning duplicate tabs on any platform.
// Web: window.open with a stable name reuses the existing browser tab.
// Native: expo-web-browser opens an in-app sheet (SFSafariViewController /
//   Chrome Custom Tab) that never lands in the system browser tab bar.
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

const WEB_WINDOW_NAME = '_kc_external';

export function openExternalUrl(url: string): void {
  if (Platform.OS === 'web') {
    const w = globalThis.window;
    if (typeof w !== 'undefined') {
      w.open(url, WEB_WINDOW_NAME);
      return;
    }
  }
  void WebBrowser.openBrowserAsync(url);
}
