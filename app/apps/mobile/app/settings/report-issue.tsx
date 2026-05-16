// FR-MOD-002 / FR-CHAT-007 AC3 — collect description + category, submit
// support issue (injects system message), navigate to the support thread.
import React, { useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChatError } from '@kc/application';
import { colors, typography, spacing, radius } from '@kc/ui';
import { container } from '../../src/lib/container';
import { NotifyModal } from '../../src/components/NotifyModal';
import he from '../../src/i18n/locales/he';

const t = he.settings.reportIssueScreen;
const CATEGORIES = ['Bug', 'Account', 'Suggestion', 'Other'] as const;

export default function ReportIssueScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [notify, setNotify] = useState<{ title: string; message: string } | null>(null);

  const descTrimmed = description.trim();
  const isValid = descTrimmed.length >= 10;

  const submit = async () => {
    if (!isValid || busy) return;
    setBusy(true);
    try {
      const chat = await container.submitSupportIssue.execute({ category, description: descTrimmed });
      router.replace({ pathname: '/chat/[id]', params: { id: chat.chatId } });
    } catch (err) {
      const errorTitle = he.settings.reportIssueErrorTitle;
      if (err instanceof ChatError && err.code === 'super_admin_not_found') {
        setNotify({ title: errorTitle, message: t.errorAdminNotFound });
      } else {
        setNotify({ title: errorTitle, message: t.errorGeneric });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t.title}</Text>
        <Text style={styles.copy}>{t.copy}</Text>

        <Text style={styles.label}>{t.categoryLabel}</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipSelected]}
              onPress={() => setCategory(category === cat ? null : cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextSelected]}>
                {(t.categories as Record<string, string>)[cat]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t.descriptionLabel}</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={5}
          placeholder={t.descriptionPlaceholder}
          placeholderTextColor={colors.textSecondary}
          value={description}
          onChangeText={setDescription}
          textAlign="right"
          maxLength={500}
        />
        {descTrimmed.length > 0 && descTrimmed.length < 10 ? (
          <Text style={styles.hint}>{t.descriptionMinLength}</Text>
        ) : null}

        <TouchableOpacity style={[styles.btn, !isValid && styles.btnDisabled]} onPress={submit} disabled={busy || !isValid}>
          {busy ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.btnText}>{t.submitBtn}</Text>}
        </TouchableOpacity>
      </ScrollView>
      <NotifyModal
        visible={notify !== null}
        title={notify?.title ?? ''}
        message={notify?.message ?? ''}
        onDismiss={() => setNotify(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  body: { padding: spacing.base, gap: spacing.md },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'right' },
  copy: { ...typography.body, color: colors.textSecondary, textAlign: 'right' },
  label: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '600' as const, textAlign: 'right' },
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { ...typography.bodySmall, color: colors.textPrimary },
  chipTextSelected: { color: colors.primary, fontWeight: '700' as const },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    minHeight: 120,
    textAlignVertical: 'top',
    ...typography.body,
    color: colors.textPrimary,
  },
  hint: { ...typography.bodySmall, color: colors.error, textAlign: 'right' },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' as const },
});
