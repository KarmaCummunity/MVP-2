// Cross-platform boolean control: native `Switch` on iOS/Android, custom track
// + thumb on web (RN `Switch` is a poor fit for desktop + mobile web).
import type { ViewStyle } from 'react-native';
import { I18nManager, Platform, Pressable, StyleSheet, Switch, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';

const TRACK_W = 52;
const TRACK_H = 28;
const THUMB = 22;
const PAD = 3;

export type PlatformSwitchAccent = 'brand' | 'positive';

export interface PlatformSwitchProps {
  readonly value: boolean;
  readonly onValueChange: (next: boolean) => void;
  readonly disabled?: boolean;
  /** Active track tint; `positive` uses semantic success (e.g. notification rows). */
  readonly accent?: PlatformSwitchAccent;
  readonly testID?: string;
  readonly accessibilityLabel?: string;
}

function activeTrackColor(accent: PlatformSwitchAccent): string {
  return accent === 'positive' ? colors.success : colors.primary;
}

function thumbOffsetPx(value: boolean): number {
  const travel = TRACK_W - THUMB - PAD * 2;
  if (I18nManager.isRTL) {
    return value ? PAD : PAD + travel;
  }
  return value ? PAD + travel : PAD;
}

function WebSwitch({
  value,
  onValueChange,
  disabled,
  accent = 'brand',
  testID,
  accessibilityLabel,
}: PlatformSwitchProps) {
  const active = activeTrackColor(accent);
  const thumbLeft = thumbOffsetPx(value);
  const webCursor: ViewStyle | null =
    Platform.OS === 'web' ? ({ cursor: disabled ? 'auto' : 'pointer' } as ViewStyle) : null;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => {
        const row: ViewStyle[] = [styles.webHit];
        if (webCursor) row.push(webCursor);
        if (pressed && !disabled) row.push(styles.pressed);
        return row;
      }}
    >
      <View
        style={[
          styles.track,
          { backgroundColor: value ? active : colors.borderStrong },
          !value && styles.trackOffBorder,
          disabled && styles.dimmed,
        ]}
      >
        <View style={[styles.thumb, { left: thumbLeft }, disabled && styles.dimmed]} />
      </View>
    </Pressable>
  );
}

export function PlatformSwitch(props: PlatformSwitchProps) {
  const accent = props.accent ?? 'brand';
  if (Platform.OS === 'web') {
    return <WebSwitch {...props} accent={accent} />;
  }
  const active = activeTrackColor(accent);
  return (
    <Switch
      testID={props.testID}
      accessibilityLabel={props.accessibilityLabel}
      value={props.value}
      onValueChange={props.onValueChange}
      disabled={props.disabled}
      trackColor={{ false: colors.borderStrong, true: active }}
      thumbColor={colors.surface}
      ios_backgroundColor={colors.borderStrong}
    />
  );
}

const styles = StyleSheet.create({
  webHit: {
    minWidth: 48,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.9 },
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: radius.full,
    position: 'relative',
  },
  trackOffBorder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: radius.full,
    top: PAD,
    backgroundColor: colors.surface,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 1px 2px rgba(0,0,0,0.18)' } as const)
      : { elevation: 2 }),
  },
  dimmed: { opacity: 0.45 },
});
