// WebPullToRefresh — custom pull-to-refresh for web.
// Mapped to: FR-FEED-010 AC2 (web side). Native uses FlatList's RefreshControl
// for AC1; this component is a passthrough on iOS / Android native.
//
// Why custom: RN-Web ignores `RefreshControl`, iOS Safari has no native PTR in
// standalone PWA, and Chrome Android's native PTR reloads the entire page
// (wiping app state). The app-level overscroll lock in `_layout.tsx` keeps the
// browser out of the gesture so this component owns it end-to-end.
//
// Why Pointer Events: a single handler set covers touch (mobile-web) AND mouse
// (desktop) AND pen — `onTouchStart` alone never fires for a desktop mouse
// drag. After `pointerdown` we attach `pointermove` / `pointerup` at the
// `window` level so the gesture follows the pointer even when it leaves the
// wrapper (desktop drags off-screen, iOS rubber-band, etc).
//
// Why a 15s safety timeout: if the parent ever leaves `isRefreshing=true`
// (network hang, bug), we still spring the indicator back so the user is
// never visually stuck on a spinner.

import React, { useEffect, useRef } from 'react';
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
const MAX_REFRESH_HOLD_MS = 15000;

export function WebPullToRefresh({ onRefresh, isRefreshing, getScrollY, children }: Props) {
  const pullValue = useRef(new Animated.Value(0)).current;
  const startYRef = useRef<number | null>(null);
  const armedRef = useRef(false);
  // Mirrors of latest prop values for use inside long-lived window listeners.
  const isRefreshingRef = useRef(isRefreshing);
  const onRefreshRef = useRef(onRefresh);
  const getScrollYRef = useRef(getScrollY);
  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
    onRefreshRef.current = onRefresh;
    getScrollYRef.current = getScrollY;
  });

  // Drive the visible indicator from `isRefreshing` once a gesture is released.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (isRefreshing) {
      Animated.timing(pullValue, {
        toValue: TRIGGER_PX,
        duration: 180,
        useNativeDriver: false,
      }).start();
      const safety = setTimeout(() => {
        Animated.spring(pullValue, {
          toValue: 0,
          tension: 90,
          friction: 12,
          useNativeDriver: false,
        }).start();
      }, MAX_REFRESH_HOLD_MS);
      return () => clearTimeout(safety);
    }
    Animated.spring(pullValue, {
      toValue: 0,
      tension: 90,
      friction: 12,
      useNativeDriver: false,
    }).start();
    return undefined;
  }, [isRefreshing, pullValue]);

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const settleAfterGesture = () => {
    if (startYRef.current === null) return;
    startYRef.current = null;
    if (armedRef.current && !isRefreshingRef.current) {
      armedRef.current = false;
      onRefreshRef.current();
      // `isRefreshing` useEffect handles the indicator hold + spring-back.
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

  const onPointerDown = (e: React.PointerEvent) => {
    if (isRefreshingRef.current || getScrollYRef.current() > 0) return;
    startYRef.current = e.clientY;
    armedRef.current = false;

    const handleMove = (ev: PointerEvent) => {
      if (startYRef.current === null) return;
      const delta = ev.clientY - startYRef.current;
      if (delta <= 0) {
        pullValue.setValue(0);
        armedRef.current = false;
        return;
      }
      // Sub-linear damping so it feels like rubber resistance past the trigger.
      const damped = Math.min(MAX_PULL_PX, Math.pow(delta, 0.85));
      pullValue.setValue(damped);
      armedRef.current = damped >= TRIGGER_PX;
    };

    const handleEnd = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleEnd);
      window.removeEventListener('pointercancel', handleEnd);
      settleAfterGesture();
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('pointerup', handleEnd);
    window.addEventListener('pointercancel', handleEnd);
  };

  return (
    <View
      style={styles.wrapper}
      // React's Pointer Events are passed through by RN-Web; cast keeps the
      // public surface compatible with RN's older View type definitions.
      {...({ onPointerDown } as unknown as Record<string, unknown>)}
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
  // `width` / `minHeight` belt-and-braces: bare `flex: 1` inside a SafeAreaView
  // with `dir=rtl` can collapse on iOS Safari, leaving the FlatList unrendered.
  wrapper: { flex: 1, width: '100%', minHeight: 0 },
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
