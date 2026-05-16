import { StyleSheet, Text, View } from 'react-native';
import { PlatformSwitch, colors } from '@kc/ui';

interface Props {
  readonly label: string;
  readonly caption: string;
  readonly value: boolean;
  readonly disabled?: boolean;
  readonly onValueChange: (next: boolean) => void;
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
      <PlatformSwitch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        accent="positive"
      />
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
});
