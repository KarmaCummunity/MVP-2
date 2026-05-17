// Screen wrapper for the redesigned main-screen idiom (login-style).
// Provides:
//   - SafeAreaView with the warm cream backdrop.
//   - Optional ambient orange blobs behind everything (density configurable).
//   - A single mount point so every main screen looks identical at the edges.
//
// `scroll` is intentional: if the screen already brings its own FlatList /
// ScrollView (e.g. feed), pass `scroll={false}` and render the list directly.
import React from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors } from '@kc/ui';
import { AmbientBlobs } from './AmbientBlobs';

interface ScreenProps {
  readonly children: React.ReactNode;
  readonly scroll?: boolean;
  readonly blobs?: 'auth' | 'content' | 'off';
  readonly edges?: readonly Edge[];
  readonly contentContainerStyle?: ViewStyle;
  readonly style?: ViewStyle;
}

export function Screen({
  children,
  scroll = false,
  blobs = 'content',
  edges = ['top'],
  contentContainerStyle,
  style,
}: ScreenProps) {
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      {blobs !== 'off' && <AmbientBlobs density={blobs} />}
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // RN-Web + `dir=rtl`: without explicit width the tree can shrink-wrap to
  // content and hug the inline-start edge, leaving empty space on the other side.
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceCream,
  },
  flex: { flex: 1, width: '100%', alignSelf: 'stretch', minWidth: 0 },
  scrollContent: { flexGrow: 1, alignSelf: 'stretch', minWidth: '100%' },
});
