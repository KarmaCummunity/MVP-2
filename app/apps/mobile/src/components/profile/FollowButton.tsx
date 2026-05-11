// app/apps/mobile/src/components/profile/FollowButton.tsx
// Five-state follow button per FR-FOLLOW-011. Hidden in self/blocked states —
// caller must check that itself; this component renders nothing for those.
// Confirm dialogs render via <ConfirmActionModal /> so they work on web (where
// react-native-web@0.21.2 makes Alert.alert a no-op).
// Mapped to: FR-FOLLOW-011, FR-FOLLOW-002 AC1, FR-FOLLOW-004 AC1.

import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius, spacing, typography } from '@kc/ui';
import type { FollowState } from '@kc/application';
import { ConfirmActionModal } from '../post/ConfirmActionModal';

export interface FollowButtonProps {
  state: FollowState;
  cooldownUntil?: string;
  onPress: () => void;
  busy?: boolean;
}

interface ButtonCfg {
  label: string;
  style?: object;
  textStyle?: object;
  disabled?: boolean;
  subtitle?: string;
  confirm?: { title: string; body: string; cta: string; destructive?: boolean };
}

export function FollowButton({ state, cooldownUntil, onPress, busy }: FollowButtonProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  if (state === 'self' || state === 'blocked') return null;

  const cfg = config(state, cooldownUntil);
  const disabled = busy || cfg.disabled;

  const handlePress = () => {
    if (cfg.confirm) setConfirmOpen(true);
    else onPress();
  };
  const handleConfirm = () => {
    setConfirmOpen(false);
    onPress();
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.btn, cfg.style, disabled && styles.btnDisabled]}
        disabled={disabled}
        onPress={handlePress}
      >
        <Text style={[styles.text, cfg.textStyle]}>{cfg.label}</Text>
        {cfg.subtitle ? <Text style={styles.subtitle}>{cfg.subtitle}</Text> : null}
      </TouchableOpacity>
      {cfg.confirm ? (
        <ConfirmActionModal
          visible={confirmOpen}
          title={cfg.confirm.title}
          message={cfg.confirm.body}
          confirmLabel={cfg.confirm.cta}
          destructive={Boolean(cfg.confirm.destructive)}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
        />
      ) : null}
    </>
  );
}

function config(state: FollowState, cooldownUntil?: string): ButtonCfg {
  switch (state) {
    case 'not_following_public':
      return { label: '+ עקוב' };
    case 'following':
      return {
        label: 'עוקב ✓',
        style: styles.btnSecondary,
        textStyle: styles.textSecondary,
        confirm: { title: 'להפסיק לעקוב?', body: '', cta: 'הפסק לעקוב', destructive: true },
      };
    case 'not_following_private_no_request':
      return { label: '+ שלח בקשה' };
    case 'request_pending':
      return {
        label: 'בקשה נשלחה ⏳',
        style: styles.btnSecondary,
        textStyle: styles.textSecondary,
        confirm: { title: 'לבטל את בקשת המעקב?', body: 'תוכלי לשלוח בקשה חדשה בכל עת.', cta: 'בטל בקשה' },
      };
    case 'cooldown_after_reject': {
      const days = cooldownUntil ? Math.max(0, Math.ceil(
        (new Date(cooldownUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )) : 0;
      return {
        label: '+ שלח בקשה',
        disabled: true,
        subtitle: `ניתן לשלוח שוב בעוד ${days} ימים`,
      };
    }
    default: return { label: '' };
  }
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    borderRadius: radius.md, alignItems: 'center', alignSelf: 'stretch',
  },
  btnSecondary: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  btnDisabled: { opacity: 0.5 },
  text: { ...typography.button, color: colors.textInverse, fontWeight: '700' as const },
  textSecondary: { color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
