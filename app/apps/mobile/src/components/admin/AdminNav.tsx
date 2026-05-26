// app/apps/mobile/src/components/admin/AdminNav.tsx
import type { ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import he from '../../i18n/locales/he';

type Item = { key: keyof typeof he.admin.nav; href: string };

function normalize(href: string): string {
  // Strip expo-router group prefix '(admin)' so the literal route
  // matches what usePathname() returns at runtime.
  return href.replace('/(admin)', '/admin').replace(/\/$/, '');
}

const ITEMS: readonly Item[] = [
  { key: 'dashboard', href: '/(admin)' },
  { key: 'reports',   href: '/(admin)/reports' },
  { key: 'tasks',     href: '/(admin)/tasks' },
  { key: 'admins',    href: '/(admin)/admins' },
  { key: 'users',     href: '/(admin)/users' },
  { key: 'posts',     href: '/(admin)/posts' },
  { key: 'audit',     href: '/(admin)/audit' },
];

export function AdminNav(): ReactElement {
  const pathname = usePathname();
  const labels = he.admin.nav;

  const content = (
    <>
      {ITEMS.map(({ key, href }) => {
        const target = normalize(href);
        const current = normalize(pathname || '/admin');
        const active = current === target;
        return (
          <Pressable
            key={key}
            onPress={() => router.push(href as never)}
            style={[styles.item, active && styles.itemActive]}
            accessibilityRole="link"
          >
            <Text style={[styles.label, active && styles.labelActive]}>{labels[key]}</Text>
          </Pressable>
        );
      })}
    </>
  );

  if (Platform.OS === 'web') {
    return <View style={styles.sidebar}>{content}</View>;
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.topbar}
    >
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sidebar: { width: 200, paddingVertical: 16, paddingHorizontal: 8, borderStartWidth: 1, borderStartColor: '#eee', gap: 4 },
  topbar:  { gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  item:    { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  itemActive: { backgroundColor: '#eef2ff' },
  label:   { fontSize: 14 },
  labelActive: { fontWeight: '600' },
});
