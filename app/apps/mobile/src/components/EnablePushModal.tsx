import { Modal, View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { makeUseStyles } from '@kc/ui';
import type { PrePromptTrigger } from '../lib/notifications/usePushPermissionGate';

interface Props {
  visible: boolean;
  trigger: PrePromptTrigger | null;
  onAccept: () => void;
  onDecline: () => void;
}

export function EnablePushModal({ visible, trigger, onAccept, onDecline }: Props) {
  const { t } = useTranslation();
  const styles = useEnablePushModalStyles();
  const bodyKey = trigger === 'first-post-published'
    ? 'notifications.enablePushBodyFromPost'
    : 'notifications.enablePushBodyFromChat';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDecline}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('notifications.enablePushTitle')}</Text>
          <Text style={styles.body}>{t(bodyKey)}</Text>
          <Pressable style={[styles.button, styles.accept]} onPress={onAccept}>
            <Text style={styles.acceptText}>{t('notifications.enablePushAccept')}</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={onDecline}>
            <Text style={styles.declineText}>{t('notifications.enablePushDecline')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const useEnablePushModalStyles = makeUseStyles(({ colors }) => ({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: colors.surfaceRaised, borderRadius: 12, padding: 20 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12, textAlign: 'right', color: colors.textPrimary },
  body: { fontSize: 14, color: colors.textSecondary, marginBottom: 20, textAlign: 'right' },
  button: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  accept: { backgroundColor: colors.primary },
  acceptText: { color: colors.textInverse, fontWeight: '600' },
  declineText: { color: colors.textSecondary },
}));
