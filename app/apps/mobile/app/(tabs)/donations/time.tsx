// Donations · Time — coming-soon copy + volunteer composer wired to support thread + community NGO links.
// Mapped to: FR-DONATE-004 (top section + composer AC1-AC9) / FR-DONATE-007..009 (list section).
// TD-114 closed: composer now sends to support thread and navigates to /chat/[id].
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChatError } from '@kc/application';
import { colors, radius, spacing, typography } from '@kc/ui';
import { useAuthStore } from '../../../src/store/authStore';
import { container } from '../../../src/lib/container';
import { DonationLinksList } from '../../../src/components/DonationLinksList';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { IconTile } from '../../../src/components/ui/IconTile';
import { MotionEntry, ENTRY_DELAY } from '../../../src/components/ui/MotionEntry';

const COMPOSER_MAX_CHARS = 2000;

export default function DonationsTimeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.userId ?? null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [sendError, setSendError] = useState(false);

  const sendDisabled = text.trim().length === 0 || busy;

  const onSend = async () => {
    const body = text.trim();
    if (!body || !userId || busy) return;
    setBusy(true);
    setSendError(false);
    try {
      const chat = await container.getSupportThread.execute({ userId });
      await container.sendMessage.execute({
        chatId: chat.chatId,
        senderId: userId,
        body: `${t('donations.timeScreen.volunteerPrefix')}${body}`,
      });
      router.push({ pathname: '/chat/[id]', params: { id: chat.chatId } });
    } catch (err) {
      if (err instanceof ChatError && err.code === 'super_admin_not_found') {
        setSendError(true);
      } else {
        setSendError(true);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen blobs="content" edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <MotionEntry variant="hero" delay={ENTRY_DELAY.hero} style={styles.hero}>
          <View style={styles.heroIcon}><IconTile icon="time-outline" size="lg" /></View>
          <Text style={styles.body}>{t('donations.timeScreen.body')}</Text>
        </MotionEntry>

        <MotionEntry variant="bottom" delay={ENTRY_DELAY.section}>
          <Card padding="base" style={styles.composerCard}>
            <Text style={styles.composerHeading}>{t('donations.timeScreen.composerHeading')}</Text>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={(v) => { setText(v); setSendError(false); }}
              placeholder={t('donations.timeScreen.composerPlaceholder')}
              placeholderTextColor={colors.textDisabled}
              multiline
              numberOfLines={5}
              maxLength={COMPOSER_MAX_CHARS}
              textAlignVertical="top"
            />
            <Pressable
              onPress={onSend}
              disabled={sendDisabled}
              accessibilityRole="button"
              accessibilityLabel={t('donations.timeScreen.sendButton')}
              accessibilityState={{ disabled: sendDisabled }}
              style={({ pressed }) => [
                styles.send,
                sendDisabled && styles.sendDisabled,
                pressed && !sendDisabled && styles.sendPressed,
              ]}
            >
              {busy ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={[styles.sendText, sendDisabled && styles.sendTextDisabled]}>
                  {t('donations.timeScreen.sendButton')}
                </Text>
              )}
            </Pressable>

            {sendError ? (
              <View style={styles.errorRow}>
                <Text style={styles.errorText}>{t('donations.timeScreen.sendError')}</Text>
                <Pressable onPress={onSend} disabled={busy}>
                  <Text style={styles.retryText}>{t('donations.timeScreen.sendRetry')}</Text>
                </Pressable>
              </View>
            ) : null}
          </Card>
        </MotionEntry>

        <MotionEntry variant="bottom" delay={ENTRY_DELAY.section + 80}>
          <DonationLinksList categorySlug="time" />
        </MotionEntry>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    gap: spacing.lg,
  },
  hero: { alignItems: 'center', gap: spacing.md },
  heroIcon: { marginBottom: spacing.xs },
  body: {
    ...typography.bodyLarge,
    color: '#1C1917',
    textAlign: 'right',
    lineHeight: 26,
    width: '100%',
  },
  composerCard: { gap: spacing.sm },
  composerHeading: {
    ...typography.body,
    fontWeight: '600' as const,
    color: '#1C1917',
    textAlign: 'right',
    lineHeight: 22,
  },
  input: {
    minHeight: 120,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  send: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendPressed: { backgroundColor: colors.primaryDark },
  sendDisabled: { backgroundColor: colors.primaryLight, opacity: 0.6 },
  sendText: { ...typography.button, color: colors.textInverse },
  sendTextDisabled: { color: colors.textInverse, opacity: 0.7 },
  errorRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  errorText: { ...typography.bodySmall, color: colors.error, textAlign: 'right' },
  retryText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' as const },
});
