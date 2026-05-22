import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { makeUseStyles, useBreakpoint, useTheme, spacing } from '@kc/ui';

type SplitAuthLayoutProps = {
  children: ReactNode;
};

/**
 * Mobile (<768): renders children as-is, no layout change.
 * Desktop (>=768): 50/50 split — children (auth form) on the rail-side
 * (logical start), brand panel on the logical end side.
 */
export function SplitAuthLayout({ children }: SplitAuthLayoutProps) {
  const bp = useBreakpoint();
  const { colors } = useTheme();
  const styles = useStyles();

  if (bp === 'mobile') return <>{children}</>;

  return (
    <View style={styles.row}>
      <View style={[styles.form, { backgroundColor: colors.background }]}>
        <View style={styles.formInner}>{children}</View>
      </View>
      <View style={[styles.brand, { backgroundColor: colors.surface }]}>
        <BrandPanel />
      </View>
    </View>
  );
}

function BrandPanel() {
  return (
    <View style={brandStyles.container}>
      <Image
        source={require('../../../assets/icon.png')}
        style={brandStyles.logo}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const useStyles = makeUseStyles(() => ({
  row: { flex: 1, flexDirection: 'row' },
  form: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  formInner: { width: '100%', maxWidth: 480, padding: spacing.lg },
  brand: { flex: 1, alignItems: 'center', justifyContent: 'center' },
}));

const brandStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: spacing['2xl'] },
  logo: { width: 200, height: 200 },
});
