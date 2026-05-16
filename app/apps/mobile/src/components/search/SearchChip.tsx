// Reusable filter chip for SearchFilterSheet.
import { Pressable, Text } from 'react-native';
import { styles } from './searchFilterSheet.styles';

interface Props {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function SearchChip({ label, active, onPress }: Props) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}
