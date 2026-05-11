import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, typography, radius } from '@kc/ui';

interface AvatarInitialsProps {
  name: string;
  avatarUrl: string | null;
  size?: number;
}

const AVATAR_COLORS = [
  '#F97316', '#6366F1', '#22C55E', '#EC4899',
  '#14B8A6', '#F59E0B', '#8B5CF6', '#3B82F6',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]!;
}

export function AvatarInitials({ name, avatarUrl, size = 40 }: AvatarInitialsProps) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('');

  const bgColor = getAvatarColor(name);

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  /** No outer margin — parents use `gap` / padding so fixed-size clips (e.g. search cards) stay circular on iOS. */
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: colors.textInverse,
    fontWeight: '700',
    textAlign: 'center',
  },
});
