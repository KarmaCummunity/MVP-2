import { View, Text, Switch, StyleSheet } from 'react-native';

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
      <Switch value={value} disabled={disabled} onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  text: { flex: 1, marginRight: 12 },
  label: { fontSize: 16, fontWeight: '500', textAlign: 'right' },
  caption: { fontSize: 12, color: '#666', marginTop: 4, textAlign: 'right' },
});
