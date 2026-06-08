// app/apps/mobile/app/(admin)/_layout.tsx
// Admin Portal shell (FR-ADMIN-011 AC1): branded sidebar on web ≥ md, and a
// horizontal pill bar on phone / mobile-web. The variant is chosen by the
// viewport width (useBreakpoint) rather than Platform.OS, so a narrow browser
// window no longer renders the desktop rail over squeezed content.
import type { ReactElement } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useBreakpoint, useTheme } from '@kc/ui';
import { AdminGate } from '../../src/components/admin/AdminGate';
import { AdminNav } from '../../src/components/admin/AdminNav';
import { rowDirectionStart } from '../../src/lib/rtlLayout';

export default function AdminLayout(): ReactElement {
  const breakpoint = useBreakpoint();
  const { colors } = useTheme();
  const isWide = breakpoint !== 'mobile'; // ≥ 768px → sidebar rail
  const bg = { backgroundColor: colors.background };
  const stackOptions = { headerShown: false, contentStyle: bg } as const;

  return (
    <AdminGate>
      <SafeAreaView style={[styles.safe, bg]}>
        {isWide ? (
          <View style={styles.row}>
            <View style={styles.main}>
              <Stack screenOptions={stackOptions} />
            </View>
            <AdminNav variant="sidebar" />
          </View>
        ) : (
          <View style={styles.col}>
            <AdminNav variant="topbar" />
            <View style={styles.main}>
              <Stack screenOptions={stackOptions} />
            </View>
          </View>
        )}
      </SafeAreaView>
    </AdminGate>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  row:  { flex: 1, flexDirection: rowDirectionStart },
  col:  { flex: 1, flexDirection: 'column' },
  main: { flex: 1 },
});
