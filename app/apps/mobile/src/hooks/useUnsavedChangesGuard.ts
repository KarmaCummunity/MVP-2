// Audit §16.10 — intercept Back navigation when the screen has unsaved
// changes, show a confirm, and only let the navigation through if the user
// picks "Discard". Platform-aware: Alert.alert on native, window.confirm on
// web (Alert.alert is a no-op on react-native-web per TD-138).
import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { useNavigation } from 'expo-router';

interface Props {
  readonly isDirty: boolean;
  readonly title: string;
  readonly message: string;
  readonly discardLabel: string;
  readonly cancelLabel: string;
}

export function useUnsavedChangesGuard({
  isDirty,
  title,
  message,
  discardLabel,
  cancelLabel,
}: Props): void {
  const navigation = useNavigation();

  useEffect(() => {
    if (!isDirty) return;
    const unsub = navigation.addListener('beforeRemove', (e: { preventDefault: () => void; data: { action: unknown } }) => {
      e.preventDefault();
      const action = e.data.action;
      if (Platform.OS === 'web') {
        const w = globalThis as unknown as { confirm: (m: string) => boolean };
        if (w.confirm(message)) navigation.dispatch(action as Parameters<typeof navigation.dispatch>[0]);
        return;
      }
      Alert.alert(title, message, [
        { text: cancelLabel, style: 'cancel' },
        {
          text: discardLabel,
          style: 'destructive',
          onPress: () => navigation.dispatch(action as Parameters<typeof navigation.dispatch>[0]),
        },
      ]);
    });
    return unsub;
  }, [isDirty, navigation, title, message, discardLabel, cancelLabel]);
}
