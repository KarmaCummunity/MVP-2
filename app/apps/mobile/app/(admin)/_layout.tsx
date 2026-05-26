// app/apps/mobile/app/(admin)/_layout.tsx
import type { ReactElement } from 'react';
import { Stack } from 'expo-router';
import { Platform, SafeAreaView, View, StyleSheet } from 'react-native';
import { AdminGate } from '../../src/components/admin/AdminGate';
import { AdminNav } from '../../src/components/admin/AdminNav';

export default function AdminLayout(): ReactElement {
  return (
    <AdminGate>
      <SafeAreaView style={styles.safe}>
        {Platform.OS === 'web' ? (
          <View style={styles.webRow}>
            <View style={styles.webMain}>
              <Stack screenOptions={{ headerShown: false }} />
            </View>
            <AdminNav />
          </View>
        ) : (
          <View style={styles.mobileCol}>
            <AdminNav />
            <View style={styles.mobileMain}>
              <Stack screenOptions={{ headerShown: false }} />
            </View>
          </View>
        )}
      </SafeAreaView>
    </AdminGate>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  webRow:     { flex: 1, flexDirection: 'row' },
  webMain:    { flex: 1 },
  mobileCol:  { flex: 1, flexDirection: 'column' },
  mobileMain: { flex: 1 },
});
