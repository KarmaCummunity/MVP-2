// IconTile — soft orange-tinted square with an icon inside.
// Three sizes match where the pattern shows up in the welcome screen:
//   sm (40)  — value-prop rows + list-row leading icon.
//   md (52)  — category chips inside a card.
//   lg (64)  — donations / search "explore" hub tiles.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@kc/ui';

type Size = 'sm' | 'md' | 'lg';

interface IconTileProps {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly size?: Size;
  readonly tone?: 'orange' | 'neutral';
}

const DIMS: Record<Size, { box: number; icon: number; radius: number }> = {
  sm: { box: 40, icon: 20, radius: 12 },
  md: { box: 52, icon: 24, radius: 14 },
  lg: { box: 64, icon: 30, radius: 16 },
};

export function IconTile({ icon, size = 'sm', tone = 'orange' }: IconTileProps) {
  const dim = DIMS[size];
  const bg = tone === 'orange' ? colors.primarySurface : '#F3F4F6';
  const fg = tone === 'orange' ? colors.primary : colors.textSecondary;
  return (
    <View
      style={[
        styles.box,
        { width: dim.box, height: dim.box, borderRadius: dim.radius, backgroundColor: bg },
      ]}
    >
      <Ionicons name={icon} size={dim.icon} color={fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
});
