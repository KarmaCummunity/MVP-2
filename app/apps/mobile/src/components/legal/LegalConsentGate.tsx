import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, View, Text, Pressable, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePathname } from 'expo-router';
import type { LegalPendingItem } from '@kc/domain';
import type { CheckPendingLegalAcksResult } from '@kc/application';
import { typography, spacing, useTheme } from '@kc/ui';
import { useAuthStore } from '../../store/authStore';
import { getCheckPendingLegalAcksUseCase } from '../../services/legalComposition';
import { useModalStackIsEmpty } from './useActiveModalStack';
import { LegalConsentScreen, type LegalConsentMode } from './LegalConsentScreen';

const FOREGROUND_DEBOUNCE_MS = 500;

interface Props {
  children: ReactNode;
}

type GateState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'clear' }
  | {
      kind: 'pending';
      result: CheckPendingLegalAcksResult;
      sheetDismissedThisSession: boolean;
      userOptedToAcceptNow: boolean;
    };

export function LegalConsentGate({ children }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const session = useAuthStore((s) => s.session);
  const userId = session?.userId ?? null;
  const pathname = usePathname();
  const modalStackEmpty = useModalStackIsEmpty();
  const [state, setState] = useState<GateState>({ kind: 'idle' });
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onReadingDoc = pathname.startsWith('/legal/');

  const runCheck = useMemo(
    () => async () => {
      if (!userId) {
        setState({ kind: 'clear' });
        return;
      }
      setState((prev) => (prev.kind === 'pending' ? prev : { kind: 'loading' }));
      try {
        const result = await getCheckPendingLegalAcksUseCase().execute();
        if (result.pending.length === 0) {
          setState({ kind: 'clear' });
        } else {
          setState({
            kind: 'pending',
            result,
            sheetDismissedThisSession: false,
            userOptedToAcceptNow: false,
          });
        }
      } catch (err) {
        // Fall open: log and let the user through (spec §7.5).
        // eslint-disable-next-line no-console
        console.warn('[legal] consent_check_skipped_offline', {
          reason: (err as Error).message,
          timestamp: new Date().toISOString(),
        });
        setState({ kind: 'clear' });
      }
    },
    [userId],
  );

  // Trigger: mount + auth change
  useEffect(() => {
    void runCheck();
  }, [runCheck]);

  // Trigger: AppState 'active' transition (debounced)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        void runCheck();
      }, FOREGROUND_DEBOUNCE_MS);
    });
    return () => {
      sub.remove();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [runCheck]);

  // Defer rendering when modal is open or user is on /legal/*
  const shouldDefer = !modalStackEmpty || onReadingDoc;

  if (state.kind !== 'pending' || shouldDefer) {
    return <>{children}</>;
  }

  const mustBlock = state.result.mustBlockImmediately;
  const isSignupShape = state.result.pending.every((p) => p.lastAcceptedVersion === 0);
  const screenMode: LegalConsentMode = isSignupShape ? 'signup' : 'update';

  // Full-screen consent: server says block, or user voluntarily opted to accept now from the sheet
  if (mustBlock || state.userOptedToAcceptNow) {
    return (
      <Modal visible animationType="slide" onRequestClose={() => void 0}>
        <LegalConsentScreen
          mode={screenMode}
          pending={state.result.pending}
          onResolved={() => void runCheck()}
        />
      </Modal>
    );
  }

  // Banner mode: in-shell affordance + first-foreground sheet
  const dismissed = state.sheetDismissedThisSession;
  return (
    <View style={{ flex: 1 }}>
      <BannerStrip
        pending={state.result.pending}
        onOpen={() => setState({ ...state, userOptedToAcceptNow: true })}
      />
      {children}
      {!dismissed ? (
        <Modal visible animationType="slide" presentationStyle="pageSheet" transparent>
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: spacing.lg,
              }}
            >
              <Text style={{ ...typography.h4, color: colors.textPrimary, textAlign: 'right' }}>
                {t('legal.updateBannerHeading')}
              </Text>
              <Text
                style={{
                  ...typography.body,
                  color: colors.textPrimary,
                  textAlign: 'right',
                  marginTop: spacing.sm,
                }}
              >
                {t('legal.updateBannerCountdown', { days: daysRemaining(state.result.pending) })}
              </Text>
              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.lg }}>
                <Pressable
                  onPress={() => setState({ ...state, sheetDismissedThisSession: true })}
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    borderRadius: 8,
                    backgroundColor: colors.surfaceRaised,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ ...typography.button, color: colors.textPrimary }}>
                    {t('legal.updateSheetSnooze')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    setState({
                      ...state,
                      sheetDismissedThisSession: true,
                      userOptedToAcceptNow: true,
                    })
                  }
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    borderRadius: 8,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ ...typography.button, color: colors.textInverse }}>
                    {t('legal.updateSheetAccept')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

function daysRemaining(pending: readonly LegalPendingItem[]): number {
  // Display-only; server is the source of truth for the banner→modal flip.
  const earliest = pending.reduce<Date | null>((acc, p) => {
    if (!acc) return p.currentEffectiveDate;
    return p.currentEffectiveDate < acc ? p.currentEffectiveDate : acc;
  }, null);
  if (!earliest) return 7;
  const elapsedDays = Math.floor((Date.now() - earliest.getTime()) / 86_400_000);
  return Math.max(0, 7 - elapsedDays);
}

function BannerStrip({
  pending,
  onOpen,
}: {
  pending: readonly LegalPendingItem[];
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onOpen}
      style={{
        backgroundColor: colors.warningLight,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
      }}
    >
      <Text
        style={{
          ...typography.bodySmall,
          color: colors.textPrimary,
          textAlign: 'right',
        }}
      >
        {t('legal.updateBannerHeading')} ·{' '}
        {t('legal.updateBannerCountdown', { days: daysRemaining(pending) })}
      </Text>
    </Pressable>
  );
}
