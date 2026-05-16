// Decorative animated background blobs for auth screens.
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export function AuthBackground() {
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);

  useEffect(() => {
    scale1.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 3200 }),
        withTiming(1, { duration: 3200 }),
      ),
      -1,
      false,
    );
    scale2.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3200 }),
        withTiming(1.1, { duration: 3200 }),
      ),
      -1,
      false,
    );
    scale3.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 4000 }),
        withTiming(1, { duration: 4000 }),
      ),
      -1,
      false,
    );
  }, []);

  const style1 = useAnimatedStyle(() => ({ transform: [{ scale: scale1.value }] }));
  const style2 = useAnimatedStyle(() => ({ transform: [{ scale: scale2.value }] }));
  const style3 = useAnimatedStyle(() => ({ transform: [{ scale: scale3.value }] }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.blob1, style1]} />
      <Animated.View style={[styles.blob2, style2]} />
      <Animated.View style={[styles.blob3, style3]} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob1: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: '#F97316',
    opacity: 0.07,
    top: -110,
    right: -90,
  },
  blob2: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#F97316',
    opacity: 0.05,
    bottom: 60,
    left: -70,
  },
  blob3: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FB923C',
    opacity: 0.06,
    bottom: 220,
    right: 20,
  },
});
