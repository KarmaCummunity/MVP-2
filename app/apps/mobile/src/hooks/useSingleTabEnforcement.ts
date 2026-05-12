// Detects duplicate browser tabs of the web app and shows a toast so the
// user knows to close the extra tab.  Native platforms are no-ops.
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useFeedSessionStore } from '../store/feedSessionStore';

export function useSingleTabEnforcement(): void {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof BroadcastChannel === 'undefined') return;

    const bc = new BroadcastChannel('kc_single_tab');

    bc.onmessage = (e: MessageEvent) => {
      if (e.data?.type === 'NEW_TAB') {
        bc.postMessage({ type: 'TAB_EXISTS' });
      }
      if (e.data?.type === 'TAB_EXISTS') {
        useFeedSessionStore.getState().showEphemeralToast(
          'האפליקציה כבר פתוחה בכרטיסייה אחרת — ניתן לסגור לשונית זו',
          'error',
          5000,
        );
      }
    };

    bc.postMessage({ type: 'NEW_TAB' });
    return () => bc.close();
  }, []);
}
