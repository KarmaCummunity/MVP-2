// FR-ADMIN-002..005 — confirmation + toast helpers for admin actions invoked
// from system-message bubbles. Centralised so each subcomponent stays small
// and the confirm/toast UX is consistent.
import { Alert, ToastAndroid, Platform } from 'react-native';
import { ModerationError } from '@kc/application';
import he from '../../../i18n/locales/he';

const t = he.moderation.actions;

export type AdminActionKey =
  | 'restore'
  | 'dismiss'
  | 'confirm'
  | 'ban'
  | 'removePost'
  | 'deleteMessage';

export interface ConfirmAndRunOpts {
  action: AdminActionKey;
  onConfirm: () => Promise<void>;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function confirmAndRun({ action, onConfirm, onSuccess, onError }: ConfirmAndRunOpts): void {
  Alert.alert(
    t[action] as string,
    t.confirmModal[action],
    [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.proceed,
        style: 'destructive',
        onPress: async () => {
          try {
            await onConfirm();
            onSuccess();
          } catch (e: unknown) {
            onError(errorMessage(e));
          }
        },
      },
    ],
    { cancelable: true },
  );
}

export function showAdminToast(msg: string): void {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert(msg);
  }
}

function errorMessage(e: unknown): string {
  if (e instanceof ModerationError) {
    if (e.code === 'forbidden') return t.errors.forbidden;
    if (e.code === 'invalid_restore_state') return t.errors.invalidRestoreState;
  }
  return t.errors.networkError;
}
