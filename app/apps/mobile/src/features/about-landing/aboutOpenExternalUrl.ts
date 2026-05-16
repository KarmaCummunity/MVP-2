import { Alert, Linking, Platform } from 'react-native';

/**
 * Opens outbound links from About (HTTPS, mailto, wa.me). Avoids relying on
 * `canOpenURL` alone — iOS often returns false for https hosts unless declared
 * in LSApplicationQueriesSchemes, which would block Instagram and similar links.
 */
export async function aboutOpenExternalUrl(url: string, errorMessage: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
      const win = globalThis.window as Window | undefined;
      if (win?.open) {
        const handle = win.open(url, '_blank', 'noopener,noreferrer');
        if (handle == null) {
          Alert.alert('', errorMessage);
        }
      }
    }
    return;
  }

  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('', errorMessage);
  }
}
