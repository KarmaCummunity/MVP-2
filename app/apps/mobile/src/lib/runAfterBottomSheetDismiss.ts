// Defer work until a React Native Modal / bottom sheet has finished dismissing.
// iOS blocks Share.share when invoked while a modal is still animating closed.
import { InteractionManager, Platform } from 'react-native';

const DISMISS_DELAY_MS = Platform.select({ ios: 400, android: 300, default: 0 }) ?? 0;

export function runAfterBottomSheetDismiss(work: () => void | Promise<void>): void {
  InteractionManager.runAfterInteractions(() => {
    if (DISMISS_DELAY_MS > 0) {
      setTimeout(() => void work(), DISMISS_DELAY_MS);
      return;
    }
    void work();
  });
}
