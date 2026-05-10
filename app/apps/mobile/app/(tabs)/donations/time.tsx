// Donations · Time — coming-soon copy + external link to we-me.app + volunteer composer + community NGO links list.
// Mapped to: FR-DONATE-004 (top section + composer) / FR-DONATE-007..009 (list section) / D-16.
// TD-114 (post-P0.5): replace local intent log with a real sendVolunteerMessageToAdmin use-case + chat navigation.
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@kc/ui';
import { DonationLinksList } from '../../../src/components/DonationLinksList';

const WE_ME_URL = 'https://www.we-me.app/';
const INTENT_LOG_KEY = 'volunteer_intent_log';
const INTENT_LOG_MAX = 50;
const COMPOSER_MAX_CHARS = 2000;

interface VolunteerIntent {
  body: string;
  createdAt: string; // ISO timestamp
}

async function appendVolunteerIntent(body: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(INTENT_LOG_KEY);
    const list: VolunteerIntent[] = raw ? JSON.parse(raw) : [];
    list.push({ body, createdAt: new Date().toISOString() });
    const trimmed = list.length > INTENT_LOG_MAX ? list.slice(-INTENT_LOG_MAX) : list;
    await AsyncStorage.setItem(INTENT_LOG_KEY, JSON.stringify(trimmed));
  } catch {
    // FR-DONATE-004 AC7: silent on storage failure; alert still shown.
  }
}

export default function DonationsTimeScreen() {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  const openLink = async () => {
    try {
      const supported = await Linking.canOpenURL(WE_ME_URL);
      if (!supported) return;
      await Linking.openURL(WE_ME_URL);
    } catch {
      // External-link failure is rare and visible in the URL handler; no alert needed.
    }
  };

  const onSend = async () => {
    const body = text.trim();
    if (!body) return;
    await appendVolunteerIntent(body);
    setText('');
    Alert.alert(t('donations.timeScreen.sendSuccessTitle'), t('donations.timeScreen.sendSuccessBody'));
  };

  const sendDisabled = text.trim().length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.iconWrap}>
          <Ionicons name="time-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.body}>{t('donations.timeScreen.body')}</Text>
        <Pressable
          onPress={openLink}
          accessibilityRole="link"
          accessibilityLabel={t('donations.timeScreen.openLink')}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Text style={styles.ctaText}>{t('donations.timeScreen.openLink')}</Text>
          <Ionicons name="open-outline" size={18} color={colors.textInverse} />
        </Pressable>

        <View style={styles.divider} />

        <Text style={styles.composerHeading}>{t('donations.timeScreen.composerHeading')}</Text>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={t('donations.timeScreen.composerPlaceholder')}
          placeholderTextColor={colors.textDisabled}
          multiline
          numberOfLines={5}
          maxLength={COMPOSER_MAX_CHARS}
          textAlign="right"
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
          <Text style={[styles.sendText, sendDisabled && styles.sendTextDisabled]}>
            {t('donations.timeScreen.sendButton')}
          </Text>
        </Pressable>

        <View style={styles.divider} />

        <DonationLinksList categorySlug="time" embedded />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    gap: spacing.lg,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  body: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    textAlign: 'right',
    lineHeight: 26,
  },
  cta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
  },
  ctaPressed: { backgroundColor: colors.primaryDark },
  ctaText: { ...typography.button, color: colors.textInverse },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  composerHeading: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'right',
    lineHeight: 22,
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  send: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  sendPressed: { backgroundColor: colors.primaryDark },
  sendDisabled: { backgroundColor: colors.primaryLight, opacity: 0.6 },
  sendText: { ...typography.button, color: colors.textInverse },
  sendTextDisabled: { color: colors.textInverse, opacity: 0.7 },
});
