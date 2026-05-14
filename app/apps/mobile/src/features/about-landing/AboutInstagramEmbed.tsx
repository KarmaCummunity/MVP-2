import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, typography, spacing, radius } from '@kc/ui';
import { Ionicons } from '@expo/vector-icons';

const INSTAGRAM_PROFILE = 'https://www.instagram.com/karma_community_/';
const INSTAGRAM_EMBED = 'https://www.instagram.com/karma_community_/embed/';

export interface AboutInstagramEmbedProps {
  readonly title: string;
  readonly caption: string;
  readonly openLabel: string;
  readonly embedNote: string;
}

export function AboutInstagramEmbed({
  title,
  caption,
  openLabel,
  embedNote,
}: AboutInstagramEmbedProps) {
  const [embedFailed, setEmbedFailed] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.caption}>{caption}</Text>
      {!embedFailed ? (
        <View style={styles.frame}>
          <WebView
            source={{ uri: INSTAGRAM_EMBED }}
            style={styles.web}
            scrollEnabled
            onError={() => setEmbedFailed(true)}
            onHttpError={() => setEmbedFailed(true)}
            accessibilityLabel={title}
          />
        </View>
      ) : (
        <Text style={styles.note}>{embedNote}</Text>
      )}
      <TouchableOpacity
        style={styles.cta}
        onPress={() => Linking.openURL(INSTAGRAM_PROFILE)}
        accessibilityRole="link"
      >
        <Ionicons name="logo-instagram" size={22} color={colors.textInverse} />
        <Text style={styles.ctaText}>{openLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  title: { ...typography.h4, color: colors.textPrimary, textAlign: 'right' },
  caption: { ...typography.body, color: colors.textSecondary, textAlign: 'right', lineHeight: 24 },
  frame: {
    height: 420,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  web: { flex: 1, backgroundColor: colors.surface },
  note: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
  cta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  ctaText: { ...typography.button, color: colors.textInverse },
});
