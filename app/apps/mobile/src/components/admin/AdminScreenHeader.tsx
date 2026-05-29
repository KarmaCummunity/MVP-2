import { Pressable, Text, View } from 'react-native';
import { makeUseStyles } from '@kc/ui';

export interface AdminScreenHeaderProps {
  readonly title:    string;
  readonly newLabel: string;
  readonly onNew:    () => void;
}

export function AdminScreenHeader({ title, newLabel, onNew }: AdminScreenHeaderProps) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      <Pressable accessibilityRole="button" onPress={onNew} style={styles.btn}>
        <Text style={styles.btnText}>{newLabel}</Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  row: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title:   { fontSize: 22, fontWeight: '700' },
  btn:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.primary },
  btnText: { color: colors.textInverse, fontSize: 13, fontWeight: '700' },
}));
