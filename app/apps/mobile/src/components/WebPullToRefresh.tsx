// WebPullToRefresh — custom pull-to-refresh for mobile web.
// Mapped to: FR-FEED-010 AC2 (web side). Native uses FlatList's RefreshControl
// for AC1; this component is a passthrough on iOS / Android.
//
// Why custom: RN-Web ignores `RefreshControl`, iOS Safari has no native PTR in
// standalone PWA, and Chrome Android's native PTR reloads the entire page
// (wiping app state). The app-level overscroll lock in `_layout.tsx` keeps the
// browser out of the gesture so this component owns it end-to-end.

import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, StyleSheet, View } from 'react-native';
import { colors } from '@kc/ui';

interface Props {
  onRefresh: () => void;
  isRefreshing: boolean;
  /** Returns current scroll Y of the inner scrollable. PTR only arms at 0. */
  getScrollY: () => number;
  children: React.ReactNode;
}

const TRIGGER_PX = 70;
const MAX_PULL_PX = 110;
const INDICATOR_SIZE = 40;

export function WebPullToRefresh({ onRefresh, isRefreshing, getScrollY, children }: Props) {
  const pullValue = useRef(new Animated.Value(0)).current;
  const startYRef = useRef<number | null>(null);
  const armedRef = useRef(false);
  const [, forceArmedRender] = useState(0);

  // Animate to "holding" position while refreshing, back to 0 when done.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (isRefreshing) {
      Animated.timing(pullValue, {
        toValue: TRIGGER_PX,
        duration: 180,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.spring(pullValue, {
        toValue: 0,
        tension: 90,
        friction: 12,
        useNativeDriver: false,
      }).start();
    }
  }, [isRefreshing, pullValue]);

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const onTouchStart = (e: { nativeEvent: { touches: Array<{ pageY: number }> } }) => {
    if (isRefreshing || getScrollY() > 0) {
      startYRef.current = null;
      return;
    }
    startYRef.current = e.nativeEvent.touches[0]?.pageY ?? null;
    armedRef.current = false;
  };

  const onTouchMove = (e: { nativeEvent: { touches: Array<{ pageY: number }> } }) => {
    if (startYRef.current === null || isRefreshing) return;
    const delta = (e.nativeEvent.touches[0]?.pageY ?? startYRef.current) - startYRef.current;
    if (delta <= 0) {
      pullValue.setValue(0);
      armedRef.current = false;
      return;
    }
    // Sub-linear damping so it feels like rubber resistance past the trigger.
    const damped = Math.min(MAX_PULL_PX, Math.pow(delta, 0.85));
    pullValue.setValue(damped);
    const wasArmed = armedRef.current;
    armedRef.current = damped >= TRIGGER_PX;
    if (wasArmed !== armedRef.current) forceArmedRender((n) => n + 1);
  };

  const onTouchEnd = () => {
    if (startYRef.current === null) return;
    startYRef.current = null;
    if (armedRef.current && !isRefreshing) {
      armedRef.current = false;
      onRefresh();
      // `isRefreshing` flip will run the useEffect to animate to TRIGGER then back.
      return;
    }
    armedRef.current = false;
    Animated.spring(pullValue, {
      toValue: 0,
      tension: 90,
      friction: 12,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View
      style={styles.wrapper}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.indicator,
          {
            transform: [{ translateY: pullValue }],
            opacity: pullValue.interpolate({
              inputRange: [0, TRIGGER_PX],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            }),
          },
        ]}
      >
        <View style={styles.indicatorBubble}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Animated.View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  indicator: {
    position: 'absolute',
    top: -INDICATOR_SIZE,
    left: 0,
    right: 0,
    height: INDICATOR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  indicatorBubble: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
});
