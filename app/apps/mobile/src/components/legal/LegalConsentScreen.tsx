import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import type { LegalDocumentContent, LegalPendingItem } from '@kc/domain';
import { typography, spacing, useTheme } from '@kc/ui';
import { LegalDocumentReader } from './LegalDocumentReader';
import {
  getAcceptLegalDocumentUseCase,
  getLoadLegalDocumentUseCase,
} from '../../services/legalComposition';
import { useAuthStore } from '../../store/authStore';

export type LegalConsentMode = 'signup' | 'update';

interface Props {
  mode: LegalConsentMode;
  pending: readonly LegalPendingItem[];
  onResolved: () => void;
}

export function LegalConsentScreen({ mode, pending, onResolved }: Props) {
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text
          style={{
            ...typography.h3,
            color: colors.textPrimary,
            textAlign: 'right',
            marginBottom: spacing.lg,
          }}
        >
          {mode === 'signup' ? t('legal.signupHeading') : t('legal.updateModalHeading')}
        </Text>

        {pending.map((p) => (
          <ConsentCard
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
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg }}>
            <Text style={{ ...typography.h4, color: colors.textPrimary, textAlign: 'right' }}>
              {t('legal.exitConfirmTitle')}
            </Text>
            <Text
              style={{
                ...typography.body,
                color: colors.textPrimary,
                textAlign: 'right',
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
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Pressable onPress={() => setReaderOpenFor(null)} style={{ padding: spacing.md }}>
              <Text style={{ ...typography.button, color: colors.primary, textAlign: 'left' }}>
                {t('legal.closeReader')}
              </Text>
            </Pressable>
            <LegalDocumentReader docType={readerOpenFor.docType} />
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

interface CardProps {
  item: LegalPendingItem;
  checked: boolean;
  onToggle: (v: boolean) => void;
  onOpenReader: () => void;
}

function ConsentCard({ item, checked, onToggle, onOpenReader }: CardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const title = item.docType === 'terms' ? t('legal.termsTitle') : t('legal.privacyTitle');
  const checkboxLabel =
    item.docType === 'terms' ? t('legal.checkboxTerms') : t('legal.checkboxPrivacy');
  const [content, setContent] = useState<LegalDocumentContent | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await getLoadLegalDocumentUseCase().execute({ docType: item.docType });
        if (!cancelled) setContent(c);
      } catch {
        // Cache fallback handles offline; nothing to do here on hard failure.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [item.docType]);

  const bullets = content?.changeSummary
    ? content.changeSummary
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('-'))
        .map((l) => l.replace(/^-\s*/, ''))
        .slice(0, 3)
    : [];

  return (
    <View
      style={{
        backgroundColor: colors.surfaceRaised,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.md,
      }}
    >
      <Text style={{ ...typography.h4, color: colors.textPrimary, textAlign: 'right' }}>
        {title}
      </Text>

      {bullets.length > 0 ? (
        <View style={{ marginTop: spacing.sm }}>
          {bullets.map((b, i) => (
            <Text
              key={i}
              style={{
                ...typography.body,
                color: colors.textPrimary,
                textAlign: 'right',
                marginBottom: spacing.xs,
              }}
            >
              {`• ${b}`}
            </Text>
          ))}
        </View>
      ) : null}

      <Pressable onPress={onOpenReader} style={{ marginTop: spacing.sm }}>
        <Text style={{ ...typography.body, color: colors.primary, textAlign: 'right' }}>
          {t('legal.cardOpenFull')}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => onToggle(!checked)}
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          marginTop: spacing.md,
          gap: spacing.sm,
        }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 4,
            borderWidth: 2,
            borderColor: colors.primary,
            backgroundColor: checked ? colors.primary : 'transparent',
          }}
        />
        <Text
          style={{
            ...typography.body,
            color: colors.textPrimary,
            flex: 1,
            textAlign: 'right',
          }}
        >
          {checkboxLabel}
        </Text>
      </Pressable>
    </View>
  );
}
