import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { useAsideContent } from './AsideContext';

export function AsidePanel() {
  const { colors } = useTheme();
  const render = useAsideContent();
  if (!render) return null;
  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {render()}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: spacing.shell.aside,
    padding: spacing.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
});
