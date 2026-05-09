// FR-CHAT-007 — Settings → "דווח על תקלה" → opens or resumes the Super Admin support thread.
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChatError } from '@kc/application';
import { colors, typography, spacing, radius } from '@kc/ui';
import { container } from '../../src/lib/container';
import { useAuthStore } from '../../src/store/authStore';

export default function ReportIssueScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.userId);
  const [busy, setBusy] = useState(false);

  const open = async () => {
    if (!userId) return;
    setBusy(true);
    try {
      const chat = await container.getSupportThread.execute({ userId });
      router.replace({ pathname: '/chat/[id]', params: { id: chat.chatId } });
    } catch (err) {
      if (err instanceof ChatError && err.code === 'super_admin_not_found') {
        Alert.alert('שירות התמיכה לא זמין', 'נסה שוב מאוחר יותר.');
      } else {
        Alert.alert('שגיאה');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.title}>דווח על תקלה</Text>
        <Text style={styles.copy}>פתח שיחת תמיכה ישירה עם הצוות. נחזור אליך בהקדם.</Text>
        <TouchableOpacity style={styles.btn} onPress={open} disabled={busy}>
          {busy ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.btnText}>פתח שיחת תמיכה</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  body: { padding: spacing.base, gap: spacing.md, alignItems: 'stretch' },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'right' },
  copy: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' as const },
});
