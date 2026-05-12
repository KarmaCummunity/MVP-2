// FR-DONATE-007/009 — single row in the community NGO link list.
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DonationLink } from '@kc/domain';
import { colors, radius, shadow, spacing, typography } from '@kc/ui';
import { openExternalUrl } from '../utils/openExternalUrl';

interface Props {
  link: DonationLink;
  canRemove: boolean;
  onMenuPress: (link: DonationLink) => void;
}

function getHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function DonationLinkRow({ link, canRemove, onMenuPress }: Props) {
  const host = getHost(link.url);
  const [iconError, setIconError] = useState(false);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${host}&sz=64`;

  const open = () => { openExternalUrl(link.url); };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={open}
        accessibilityRole="link"
        accessibilityLabel={`${link.displayName} — ${host}`}
        style={({ pressed }) => [styles.rowMain, pressed && styles.rowPressed]}
      >
        <View style={styles.iconWrap}>
          {iconError ? (
            <Ionicons name="link-outline" size={22} color={colors.primary} />
          ) : (
            <Image
              source={{ uri: faviconUrl }}
              style={styles.favicon}
              onError={() => setIconError(true)}
            />
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>{link.displayName}</Text>
          {link.description ? (
            <Text style={styles.description} numberOfLines={2}>{link.description}</Text>
          ) : null}
          <Text style={styles.host} numberOfLines={1}>{host}</Text>
        </View>
      </Pressable>

      <Pressable
        onPress={() => onMenuPress(link)}
        accessibilityRole="button"
        accessibilityLabel={canRemove ? 'אפשרויות נוספות' : 'אפשרויות'}
        hitSlop={8}
        style={styles.menuBtn}
      >
        <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 80,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    ...shadow.card,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 0,
  },
  rowPressed: {
    backgroundColor: colors.background,
    transform: [{ scale: 0.99 }],
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  favicon: { width: 28, height: 28 },
  body: { flex: 1, gap: 2 },
  title: { ...typography.h3, color: colors.textPrimary, textAlign: 'right' },
  description: { ...typography.body, color: colors.textSecondary, textAlign: 'right' },
  host: { ...typography.caption, color: colors.textDisabled, textAlign: 'right' },
  menuBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
});
