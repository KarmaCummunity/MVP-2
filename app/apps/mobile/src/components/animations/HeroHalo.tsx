import React from 'react';
import { View } from 'react-native';
import { makeUseStyles } from '@kc/ui';

export interface HeroHaloProps {
  readonly size: number;
  readonly children: React.ReactNode;
}

const INNER_RATIO = 0.84;

export function HeroHalo({ size, children }: HeroHaloProps) {
  const styles = useHeroHaloStyles();
  const inner = Math.round(size * INNER_RATIO);
  return (
    <View
      style={[
        styles.outer,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <View
        style={[
          styles.inner,
          { width: inner, height: inner, borderRadius: inner / 2 },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const useHeroHaloStyles = makeUseStyles(({ colors }) => ({
  outer: {
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
