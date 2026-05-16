// Cross-platform two-button confirmation helper.
//
// Alert.alert(title, message, [cancel, action]) is a no-op on
// react-native-web@0.21.2 — the entire 3-arg form is silently dropped, so any
// caller relying on a button callback (the "open settings" path in
// avatarUpload / imageUpload, etc.) never executes on web. This wrapper
// resolves copy through the native browser window.confirm
// on web and through Alert.alert on iOS / Android, returning whether the
// user picked the affirmative action.
//
// Part of the TD-138 sweep.
import { Alert, Platform } from 'react-native';
import i18n from '../i18n';

interface ConfirmOptions {
  /** Affirmative button label. Defaults to general.confirm translation. */
  confirmLabel?: string;
  /** Cancel button label. Defaults to general.cancel. Web uses the browser-native pair. */
  cancelLabel?: string;
  /** When true, the affirmative button is rendered in destructive style on iOS. */
  destructive?: boolean;
}

/**
 * Show a two-button confirmation. Resolves to true when the user picks
 * the affirmative action and false on cancel / dismiss / unsupported env.
 */
export function confirmAction(
  title: string,
  message: string,
  options: ConfirmOptions = {},
): Promise<boolean> {
  const {
    confirmLabel = i18n.t('general.confirm'),
    cancelLabel = i18n.t('general.cancel'),
    destructive,
  } = options;

  if (Platform.OS === 'web') {
    const w = globalThis.window;
    if (typeof w === 'undefined') return Promise.resolve(false);
    return Promise.resolve(w.confirm(`${title}\n\n${message}`));
  }

  return new Promise<boolean>((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { onDismiss: () => resolve(false) },
    );
  });
}
