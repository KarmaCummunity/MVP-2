import { useRef, useEffect } from 'react';
import { Animated, Platform, Pressable, View, Text, StyleSheet } from 'react-native';
import { colors } from '@kc/ui';

const TRACK_W = 50;
const TRACK_H = 28;
const THUMB = 22;
const MARGIN = 3;
const TRAVEL = TRACK_W - THUMB - MARGIN * 2;

interface SwitchProps {
  value: boolean;
  disabled?: boolean;
  onValueChange: (next: boolean) => void;
}

function KCSwitch({ value, disabled, onValueChange }: SwitchProps) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [value, anim]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [MARGIN, MARGIN + TRAVEL],
  });

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      style={{ opacity: disabled ? 0.4 : 1 }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
    >
      <View style={[styles.track, value ? styles.trackOn : styles.trackOff]}>
        <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
      </View>
    </Pressable>
  );
}

interface Props {
  label: string;
  caption: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (next: boolean) => void;
}

export function NotificationToggleRow({
  label,
  caption,
  value,
  disabled,
  onValueChange,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.caption}>{caption}</Text>
      </View>
      <KCSwitch value={value} disabled={disabled} onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  text: { flex: 1, marginLeft: 12 },
  label: { fontSize: 16, fontWeight: '500', textAlign: 'right' },
  caption: { fontSize: 12, color: colors.textSecondary, marginTop: 4, textAlign: 'right' },
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    justifyContent: 'center',
  },
  trackOn: { backgroundColor: colors.success },
  trackOff: { backgroundColor: colors.border },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: MARGIN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
