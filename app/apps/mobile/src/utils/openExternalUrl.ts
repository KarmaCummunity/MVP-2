// Opens an external URL without spawning duplicate tabs on web.
// On web: window.open with a stable name so the browser reuses the existing
// tab instead of opening a new one on every press.
// On native: delegates to Linking.openURL as normal.
import { Linking, Platform } from 'react-native';

const WEB_WINDOW_NAME = '_kc_external';

export function openExternalUrl(url: string): void {
  if (Platform.OS === 'web') {
    const w = globalThis.window;
    if (typeof w !== 'undefined') {
      w.open(url, WEB_WINDOW_NAME);
      return;
    }
  }
  void Linking.openURL(url);
}
