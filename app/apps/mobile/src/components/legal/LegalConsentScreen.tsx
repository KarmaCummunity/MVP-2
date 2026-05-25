import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import type { LegalPendingItem } from '@kc/domain';
import { typography, spacing, useTheme } from '@kc/ui';
import { LegalDocumentReader } from './LegalDocumentReader';
import { LegalConsentCard } from './LegalConsentCard';
import { getAcceptLegalDocumentUseCase } from '../../services/legalComposition';
import { useAuthStore } from '../../store/authStore';

export type LegalConsentMode = 'signup' | 'update';

interface LegalConsentScreenProps {
  readonly mode: LegalConsentMode;
  readonly pending: readonly LegalPendingItem[];
  readonly onResolved: () => void;
}

export function LegalConsentScreen({ mode, pending, onResolved }: LegalConsentScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [readerOpenFor, setReaderOpenFor] = useState<LegalPendingItem | null>(null);

  const allChecked = useMemo(() => pending.every((p) => accepted[p.docType]), [pending, accepted]);

  const onSubmit = async () => {
    if (submitting || !allChecked) return;
    setSubmitting(true);
    try {
      await Promise.all(
        pending.map((p) =>
          getAcceptLegalDocumentUseCase().execute({
            docType: p.docType,
            version: p.currentVersion,
            locale: 'he',
            userAgent: `${Platform.OS}/${Platform.Version}`,
          }),
        ),
      );
      onResolved();
    } finally {
      setSubmitting(false);
    }
  };

  const onExit = async () => {
    setExitConfirmOpen(false);
    useAuthStore.getState().signOut();
    router.replace('/');
  };

  // Modals (and the web SPA) render outside the root SafeAreaProvider's padding
  // — wrap in SafeAreaView so the H3 heading clears the iOS status bar / web
  // address bar instead of bleeding under it (see screenshot regression).
  // `edges=['top','bottom']` only — we want horizontal flush to the screen.
  const containerStyle =
    Platform.OS === 'web'
      ? ({ maxWidth: 560, alignSelf: 'center', width: '100%' } as const)
      : undefined;

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView contentContainerStyle={[{ padding: spacing.lg }, containerStyle]}>
        <Text
          accessibilityRole="header"
          style={{
            ...typography.h3,
            color: colors.textPrimary,
            textAlign: 'right',
            writingDirection: 'rtl',
            marginBottom: spacing.lg,
          }}
        >
          {mode === 'signup' ? t('legal.signupHeading') : t('legal.updateModalHeading')}
        </Text>

        {pending.map((p) => (
          <LegalConsentCard
            key={p.docType}
            item={p}
            checked={!!accepted[p.docType]}
            onToggle={(v) => setAccepted((s) => ({ ...s, [p.docType]: v }))}
            onOpenReader={() => setReaderOpenFor(p)}
          />
        ))}

        <Pressable
          onPress={onSubmit}
          disabled={!allChecked || submitting}
          style={({ pressed }) => ({
            marginTop: spacing.lg,
            paddingVertical: spacing.md,
            borderRadius: 12,
            backgroundColor: !allChecked || submitting ? colors.surfaceRaised : colors.primary,
            opacity: pressed ? 0.85 : 1,
            alignItems: 'center',
          })}
        >
          <Text style={{ ...typography.button, color: colors.textInverse }}>
            {mode === 'signup' ? t('legal.signupContinue') : t('legal.updateConfirmCta')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setExitConfirmOpen(true)}
          style={{ marginTop: spacing.md, alignSelf: 'center' }}
        >
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>
            {t('legal.exitLink')}
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={exitConfirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setExitConfirmOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.overlay,
            justifyContent: 'center',
            padding: spacing.lg,
          }}
        >
          <View
            style={[
              { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg },
              Platform.OS === 'web'
                ? ({ width: '100%', maxWidth: 480, alignSelf: 'center' } as const)
                : null,
            ]}
          >
            <Text
              accessibilityRole="header"
              style={{
                ...typography.h4,
                color: colors.textPrimary,
                textAlign: 'right',
                writingDirection: 'rtl',
              }}
            >
              {t('legal.exitConfirmTitle')}
            </Text>
            <Text
              style={{
                ...typography.body,
                color: colors.textPrimary,
                textAlign: 'right',
                writingDirection: 'rtl',
                marginVertical: spacing.md,
              }}
            >
              {t('legal.exitConfirmBody')}
            </Text>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
              <Pressable
                onPress={onExit}
                style={{
                  flex: 1,
                  paddingVertical: spacing.md,
                  borderRadius: 8,
                  backgroundColor: colors.error,
                  alignItems: 'center',
                }}
              >
                <Text style={{ ...typography.button, color: colors.textInverse }}>
                  {t('legal.exitConfirmConfirm')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setExitConfirmOpen(false)}
                style={{
                  flex: 1,
                  paddingVertical: spacing.md,
                  borderRadius: 8,
                  backgroundColor: colors.surfaceRaised,
                  alignItems: 'center',
                }}
              >
                <Text style={{ ...typography.button, color: colors.textPrimary }}>
                  {t('legal.exitConfirmCancel')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!readerOpenFor}
        animationType="slide"
        onRequestClose={() => setReaderOpenFor(null)}
      >
        {readerOpenFor ? (
          <SafeAreaView
            edges={['top', 'bottom']}
            style={{ flex: 1, backgroundColor: colors.background }}
          >
            <Pressable
              onPress={() => setReaderOpenFor(null)}
              style={{ padding: spacing.md, alignSelf: 'flex-start' }}
            >
              <Text style={{ ...typography.button, color: colors.primary }}>
                {t('legal.closeReader')}
              </Text>
            </Pressable>
            <LegalDocumentReader docType={readerOpenFor.docType} />
          </SafeAreaView>
        ) : null}
      </Modal>
    </SafeAreaView>
  );
}

