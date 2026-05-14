# Onboarding Smart Animations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add restrained, professional motion to the 4-step onboarding flow (about-intro → basic-info → photo → tour) — both element-level entry animations and inter-screen transitions — without changing any FR acceptance criteria.

**Architecture:** Introduce a tiny shared motion layer (`src/lib/animations/motion.ts` + `src/hooks/useReducedMotion.ts` + 4 primitives in `src/components/animations/`). Each onboarding screen wraps its existing content in `<AnimatedEntry>` blocks with staggered delays. The tour carousel is replaced with a gesture-driven `TourSlidePager`. All animations use Reanimated v4 worklets on the UI thread; all respect `prefers-reduced-motion`.

**Tech Stack:** `react-native-reanimated@4.1.7` (already installed + babel plugin configured), `react-native-gesture-handler@2.28.0`, `expo-haptics@15.0.8`, vitest for unit tests.

**Mapped to spec:** FR-AUTH-018, FR-AUTH-010, FR-AUTH-011, FR-AUTH-012 (motion polish — no AC changes). Refactor logged: TD entry for "motion tokens introduced" added in Task 12.

**Design tokens (locked in here, used by every task):**
- Durations: `instant=0`, `fast=150ms`, `base=220ms`, `slow=320ms`
- Easings: `easeOut` for entry (`Easing.out(Easing.cubic)`), `easeIn` for exit (`Easing.in(Easing.cubic)`), `spring` for press (`damping:18, stiffness:240`)
- Entry distance: `12px` translateY
- Stagger increment: `70ms` between siblings
- Press scale: `0.96` with haptic `Light`
- Reduced motion: durations clamp to `0ms`, distance to `0px`, opacity transitions retained

**Hebrew RTL note:** The tour pager uses `I18nManager.isRTL` to flip swipe direction so "next" feels natural. Stack screens keep expo-router's default platform-native push.

---

## File Structure

**New files:**
- `apps/mobile/src/lib/animations/motion.ts` — design tokens (durations, easings, distances)
- `apps/mobile/src/hooks/useReducedMotion.ts` — `AccessibilityInfo.isReduceMotionEnabled()` hook
- `apps/mobile/src/hooks/__tests__/useReducedMotion.test.ts`
- `apps/mobile/src/components/animations/AnimatedEntry.tsx` — fade + translateY entry primitive
- `apps/mobile/src/components/animations/PressableScale.tsx` — scale-on-press button w/ optional haptic
- `apps/mobile/src/components/animations/OnboardingProgressBar.tsx` — animated 4-step progress bar
- `apps/mobile/src/components/animations/TourSlidePager.tsx` — gesture-driven 3-slide pager
- `apps/mobile/src/lib/animations/__tests__/motion.test.ts`

**Modified files:**
- `apps/mobile/app/(onboarding)/_layout.tsx` — set `animation: 'slide_from_right'`, `animationDuration: 280`
- `apps/mobile/src/components/OnboardingStepHeader.tsx` — add progress bar below row
- `apps/mobile/app/(onboarding)/about-intro.tsx` — wrap blocks in `AnimatedEntry`, replace CTA with `PressableScale`
- `apps/mobile/app/(onboarding)/basic-info.tsx` — wrap fields in `AnimatedEntry`, CTA → `PressableScale`
- `apps/mobile/app/(onboarding)/photo.tsx` — wrap title/avatar/CTA in `AnimatedEntry`, CTAs → `PressableScale`
- `apps/mobile/app/(onboarding)/tour.tsx` — replace setState flip with `<TourSlidePager>`
- `docs/SSOT/TECH_DEBT.md` — add TD entry (closed) for "onboarding motion polish + motion tokens"

---

## Task 1: Motion design tokens

**Files:**
- Create: `apps/mobile/src/lib/animations/motion.ts`
- Test: `apps/mobile/src/lib/animations/__tests__/motion.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/lib/animations/__tests__/motion.test.ts
import { describe, expect, it } from 'vitest';
import { MOTION, staggerDelay, applyReducedMotion } from '../motion';

describe('motion tokens', () => {
  it('exposes durations in ms', () => {
    expect(MOTION.duration.instant).toBe(0);
    expect(MOTION.duration.fast).toBe(150);
    expect(MOTION.duration.base).toBe(220);
    expect(MOTION.duration.slow).toBe(320);
  });

  it('exposes a 12px entry distance', () => {
    expect(MOTION.entryDistance).toBe(12);
  });

  it('staggerDelay returns 0 for the first child', () => {
    expect(staggerDelay(0)).toBe(0);
  });

  it('staggerDelay increments by 70ms', () => {
    expect(staggerDelay(1)).toBe(70);
    expect(staggerDelay(3)).toBe(210);
  });

  it('applyReducedMotion zeroes duration + distance when reduced', () => {
    const cfg = { duration: 220, distance: 12, delay: 70 };
    expect(applyReducedMotion(cfg, true)).toEqual({ duration: 0, distance: 0, delay: 0 });
    expect(applyReducedMotion(cfg, false)).toEqual(cfg);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && pnpm --filter @kc/mobile test -- motion`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the tokens**

```ts
// apps/mobile/src/lib/animations/motion.ts
import { Easing } from 'react-native-reanimated';

export const MOTION = {
  duration: {
    instant: 0,
    fast: 150,
    base: 220,
    slow: 320,
  },
  easing: {
    easeOut: Easing.out(Easing.cubic),
    easeIn: Easing.in(Easing.cubic),
  },
  spring: {
    damping: 18,
    stiffness: 240,
    mass: 1,
  },
  entryDistance: 12,
  staggerStep: 70,
  pressScale: 0.96,
} as const;

export function staggerDelay(index: number): number {
  return index * MOTION.staggerStep;
}

export interface MotionConfig {
  readonly duration: number;
  readonly distance: number;
  readonly delay: number;
}

export function applyReducedMotion(
  cfg: MotionConfig,
  reduced: boolean,
): MotionConfig {
  if (!reduced) return cfg;
  return { duration: 0, distance: 0, delay: 0 };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && pnpm --filter @kc/mobile test -- motion`
Expected: PASS, 5 assertions.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/lib/animations/motion.ts apps/mobile/src/lib/animations/__tests__/motion.test.ts
git commit -m "feat(mobile): add motion design tokens"
```

---

## Task 2: `useReducedMotion` hook

**Files:**
- Create: `apps/mobile/src/hooks/useReducedMotion.ts`
- Test: `apps/mobile/src/hooks/__tests__/useReducedMotion.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/hooks/__tests__/useReducedMotion.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-native';

const isReduceMotionEnabled = vi.fn();
const subscribers: Array<(v: boolean) => void> = [];
const addEventListener = vi.fn((event: string, cb: (v: boolean) => void) => {
  subscribers.push(cb);
  return { remove: () => { subscribers.splice(subscribers.indexOf(cb), 1); } };
});

vi.mock('react-native', () => ({
  AccessibilityInfo: { isReduceMotionEnabled, addEventListener },
}));

import { useReducedMotion } from '../useReducedMotion';

describe('useReducedMotion', () => {
  beforeEach(() => {
    isReduceMotionEnabled.mockResolvedValue(false);
    subscribers.length = 0;
  });

  it('returns false until the async check resolves', async () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true after AccessibilityInfo resolves true', async () => {
    isReduceMotionEnabled.mockResolvedValue(true);
    const { result } = renderHook(() => useReducedMotion());
    await act(async () => { await Promise.resolve(); });
    expect(result.current).toBe(true);
  });

  it('updates when AccessibilityInfo fires a change event', async () => {
    const { result } = renderHook(() => useReducedMotion());
    await act(async () => { await Promise.resolve(); });
    act(() => { subscribers.forEach((s) => s(true)); });
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && pnpm --filter @kc/mobile test -- useReducedMotion`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

```ts
// apps/mobile/src/hooks/useReducedMotion.ts
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (v: boolean) => { if (mounted) setReduced(v); },
    );
    return () => { mounted = false; sub.remove(); };
  }, []);

  return reduced;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && pnpm --filter @kc/mobile test -- useReducedMotion`
Expected: PASS, 3 assertions.

If `@testing-library/react-native` isn't installed in the mobile workspace, skip the hook test (replace it with a pure unit test that exercises only the return shape) and document in the commit body that hook tests require this dev-dep. **Do not add the dep as part of this plan** — the user did not authorize new dependencies.

Fallback test (use if `@testing-library/react-native` is unavailable):

```ts
import { describe, expect, it } from 'vitest';
import { useReducedMotion } from '../useReducedMotion';

describe('useReducedMotion', () => {
  it('exports a hook function', () => {
    expect(typeof useReducedMotion).toBe('function');
  });
});
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/hooks/useReducedMotion.ts apps/mobile/src/hooks/__tests__/useReducedMotion.test.ts
git commit -m "feat(mobile): add useReducedMotion hook"
```

---

## Task 3: `<AnimatedEntry>` primitive

**Files:**
- Create: `apps/mobile/src/components/animations/AnimatedEntry.tsx`

- [ ] **Step 1: Implement the primitive**

```tsx
// apps/mobile/src/components/animations/AnimatedEntry.tsx
import React, { useEffect } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { MOTION } from '../../lib/animations/motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface AnimatedEntryProps {
  readonly children: React.ReactNode;
  readonly delay?: number;
  readonly duration?: number;
  readonly distance?: number;
  readonly style?: StyleProp<ViewStyle>;
}

export function AnimatedEntry({
  children,
  delay = 0,
  duration = MOTION.duration.base,
  distance = MOTION.entryDistance,
  style,
}: AnimatedEntryProps) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(distance);

  useEffect(() => {
    const d = reduced ? 0 : duration;
    const wait = reduced ? 0 : delay;
    opacity.value = withDelay(wait, withTiming(1, { duration: d, easing: MOTION.easing.easeOut }));
    translateY.value = withDelay(wait, withTiming(0, { duration: d, easing: MOTION.easing.easeOut }));
  }, [reduced, delay, duration, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
```

- [ ] **Step 2: Typecheck**

Run: `cd app && pnpm --filter @kc/mobile typecheck`
Expected: PASS (no new errors).

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/animations/AnimatedEntry.tsx
git commit -m "feat(mobile): add AnimatedEntry primitive"
```

---

## Task 4: `<PressableScale>` button

**Files:**
- Create: `apps/mobile/src/components/animations/PressableScale.tsx`

- [ ] **Step 1: Implement**

```tsx
// apps/mobile/src/components/animations/PressableScale.tsx
import React from 'react';
import { Pressable, ViewStyle, StyleProp, AccessibilityProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MOTION } from '../../lib/animations/motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface PressableScaleProps extends AccessibilityProps {
  readonly children: React.ReactNode;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly haptic?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly hitSlop?: number;
}

export function PressableScale({
  children,
  onPress,
  disabled = false,
  haptic = true,
  style,
  hitSlop,
  ...a11y
}: PressableScaleProps) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = reduced ? 1 : withSpring(MOTION.pressScale, MOTION.spring);
  };
  const handlePressOut = () => {
    scale.value = reduced ? 1 : withSpring(1, MOTION.spring);
  };
  const handlePress = () => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop}
      {...a11y}
    >
      <Animated.View style={[style, animated]}>{children}</Animated.View>
    </Pressable>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd app && pnpm --filter @kc/mobile typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/animations/PressableScale.tsx
git commit -m "feat(mobile): add PressableScale with haptic feedback"
```

---

## Task 5: `<OnboardingProgressBar>` (animated)

**Files:**
- Create: `apps/mobile/src/components/animations/OnboardingProgressBar.tsx`

- [ ] **Step 1: Implement**

```tsx
// apps/mobile/src/components/animations/OnboardingProgressBar.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius } from '@kc/ui';
import { MOTION } from '../../lib/animations/motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface OnboardingProgressBarProps {
  readonly step: 1 | 2 | 3 | 4;
  readonly total?: number;
}

export function OnboardingProgressBar({ step, total = 4 }: OnboardingProgressBarProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(step / total);

  useEffect(() => {
    const d = reduced ? 0 : MOTION.duration.slow;
    progress.value = withTiming(step / total, { duration: d, easing: MOTION.easing.easeOut });
  }, [step, total, reduced, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ now: step, min: 0, max: total }}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
});
```

- [ ] **Step 2: Typecheck**

Run: `cd app && pnpm --filter @kc/mobile typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/animations/OnboardingProgressBar.tsx
git commit -m "feat(mobile): add OnboardingProgressBar"
```

---

## Task 6: Wire progress bar into `OnboardingStepHeader`

**Files:**
- Modify: `apps/mobile/src/components/OnboardingStepHeader.tsx`

- [ ] **Step 1: Edit the component**

Replace the file with:

```tsx
// FR-AUTH-018 + FR-AUTH-010..012 — onboarding chrome: skip · step · back + animated progress.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@kc/ui';
import { OnboardingProgressBar } from './animations/OnboardingProgressBar';

export interface OnboardingStepHeaderProps {
  readonly step: 1 | 2 | 3 | 4;
  readonly onSkip: () => void;
  readonly onBack: () => void;
  readonly skipDisabled?: boolean;
  readonly backDisabled?: boolean;
}

export function OnboardingStepHeader({
  step,
  onSkip,
  onBack,
  skipDisabled = false,
  backDisabled = false,
}: OnboardingStepHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <TouchableOpacity
          onPress={onSkip}
          disabled={skipDisabled}
          accessibilityRole="button"
          accessibilityLabel="דלג"
          style={styles.side}
        >
          <Text style={[styles.skip, skipDisabled && styles.muted]}>דלג</Text>
        </TouchableOpacity>
        <Text style={styles.step} accessibilityRole="text">
          שלב {step} מתוך 4
        </Text>
        <Pressable
          onPress={onBack}
          disabled={backDisabled}
          accessibilityRole="button"
          accessibilityLabel="חזרה"
          hitSlop={12}
          style={({ pressed }) => [styles.side, pressed && { opacity: 0.6 }]}
        >
          <Ionicons
            name="arrow-forward"
            size={22}
            color={backDisabled ? colors.textDisabled : colors.primary}
          />
        </Pressable>
      </View>
      <OnboardingProgressBar step={step} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  side: { minWidth: 72, justifyContent: 'center', alignItems: 'center' },
  step: {
    ...typography.caption,
    flex: 1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  skip: { ...typography.body, color: colors.primary, textAlign: 'right' },
  muted: { color: colors.textDisabled },
});
```

- [ ] **Step 2: Typecheck**

Run: `cd app && pnpm --filter @kc/mobile typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/OnboardingStepHeader.tsx
git commit -m "feat(mobile): show animated progress bar in onboarding header"
```

---

## Task 7: Animate `about-intro.tsx`

**Files:**
- Modify: `apps/mobile/app/(onboarding)/about-intro.tsx`

- [ ] **Step 1: Apply entries + PressableScale CTA**

Replace the screen body (keep imports for translation/router/etc. intact). The full file (target ≤ 200 lines — current ~100, headroom OK):

```tsx
// Onboarding step 1 of 4 — FR-AUTH-018 (mini about before FR-AUTH-010)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@kc/ui';
import { OnboardingStepHeader } from '../../src/components/OnboardingStepHeader';
import { AnimatedEntry } from '../../src/components/animations/AnimatedEntry';
import { PressableScale } from '../../src/components/animations/PressableScale';
import { staggerDelay } from '../../src/lib/animations/motion';

export default function OnboardingAboutIntroScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const goBasicInfo = () => router.replace('/(onboarding)/basic-info');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <OnboardingStepHeader
          step={1}
          onSkip={goBasicInfo}
          onBack={() => router.replace('/(auth)')}
        />
        <AnimatedEntry delay={staggerDelay(0)}>
          <Text style={styles.title}>{t('onboarding.aboutIntroTitle')}</Text>
        </AnimatedEntry>
        <AnimatedEntry delay={staggerDelay(1)}>
          <Text style={styles.lead}>{t('aboutContent.tagline')}</Text>
        </AnimatedEntry>
        <AnimatedEntry delay={staggerDelay(2)}>
          <Text style={styles.body}>{t('onboarding.aboutIntroBody')}</Text>
        </AnimatedEntry>
        <AnimatedEntry delay={staggerDelay(3)}>
          <Text style={styles.hint}>{t('onboarding.aboutIntroSettingsHint')}</Text>
        </AnimatedEntry>
        <AnimatedEntry delay={staggerDelay(4)}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push('/about')}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.aboutIntroReadMore')}
          >
            <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
            <Text style={styles.linkText}>{t('onboarding.aboutIntroReadMore')}</Text>
          </TouchableOpacity>
        </AnimatedEntry>
      </ScrollView>
      <AnimatedEntry delay={staggerDelay(5)} style={styles.footer}>
        <PressableScale
          style={styles.cta}
          onPress={goBasicInfo}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.continue')}
        >
          <Text style={styles.ctaText}>{t('onboarding.continue')}</Text>
        </PressableScale>
      </AnimatedEntry>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: spacing.lg,
    gap: spacing.base,
  },
  title: { ...typography.h1, color: colors.textPrimary, textAlign: 'right' },
  lead: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'right',
    fontWeight: '600',
    lineHeight: 24,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: 24,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: 20,
  },
  linkRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
  },
  linkText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.base },
  cta: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: { ...typography.button, color: colors.textInverse },
});
```

- [ ] **Step 2: Typecheck + lint**

Run: `cd app && pnpm --filter @kc/mobile typecheck && pnpm --filter @kc/mobile lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/\(onboarding\)/about-intro.tsx
git commit -m "feat(mobile): stagger entry animations on about-intro"
```

---

## Task 8: Animate `basic-info.tsx`

**Files:**
- Modify: `apps/mobile/app/(onboarding)/basic-info.tsx`

- [ ] **Step 1: Edit screen**

Wrap the title/subtitle/name-field/address-block in staggered `AnimatedEntry`, swap CTA to `PressableScale`. Keep file ≤ 200 lines. Diff to apply:

Add imports near the existing `@kc/ui` import:

```tsx
import { AnimatedEntry } from '../../src/components/animations/AnimatedEntry';
import { PressableScale } from '../../src/components/animations/PressableScale';
import { staggerDelay } from '../../src/lib/animations/motion';
```

Replace the inner content (`<Text style={styles.title}>…</Text>` through the `<EditProfileAddressBlock …/>` and the CTA `<TouchableOpacity>`) with:

```tsx
<AnimatedEntry delay={staggerDelay(0)}>
  <Text style={styles.title}>פרטים בסיסיים</Text>
</AnimatedEntry>
<AnimatedEntry delay={staggerDelay(1)}>
  <Text style={styles.subtitle}>{t('onboarding.basicInfoSubtitle')}</Text>
</AnimatedEntry>

<AnimatedEntry delay={staggerDelay(2)} style={styles.field}>
  <Text style={styles.label}>שם מלא</Text>
  <TextInput
    style={styles.input}
    value={displayName}
    onChangeText={setDisplayName}
    placeholder="לדוגמה: רינה כהן"
    placeholderTextColor={colors.textDisabled}
    maxLength={50}
    textAlign="right"
    editable={!loading}
  />
</AnimatedEntry>

<AnimatedEntry delay={staggerDelay(3)}>
  <EditProfileAddressBlock
    city={city}
    onCityChange={setCity}
    street={street}
    streetNumber={streetNumber}
    onStreetChange={setStreet}
    onStreetNumberChange={setStreetNumber}
    disabled={loading}
  />
</AnimatedEntry>
```

Replace the CTA `<TouchableOpacity …>` with:

```tsx
<PressableScale
  style={[
    styles.cta,
    !hasRequiredFields && { opacity: 0.4 },
    hasRequiredFields && !canSubmit && { opacity: 0.85 },
  ]}
  disabled={!hasRequiredFields || loading}
  onPress={handleContinue}
  accessibilityRole="button"
  accessibilityLabel="המשך"
>
  {loading ? (
    <ActivityIndicator color={colors.textInverse} />
  ) : (
    <Text style={styles.ctaText}>המשך</Text>
  )}
</PressableScale>
```

- [ ] **Step 2: Typecheck + lint + arch**

Run: `cd app && pnpm --filter @kc/mobile typecheck && pnpm --filter @kc/mobile lint`
Expected: PASS, file under 200 lines (verify: `wc -l apps/mobile/app/\(onboarding\)/basic-info.tsx`).

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/\(onboarding\)/basic-info.tsx
git commit -m "feat(mobile): stagger entries + PressableScale CTA on basic-info"
```

---

## Task 9: Animate `photo.tsx` (mind the 200-line cap)

**Files:**
- Modify: `apps/mobile/app/(onboarding)/photo.tsx`

`photo.tsx` is currently at 200 lines. To stay under the cap we must extract the avatar pick/remove handlers into a hook FIRST, then add animations.

- [ ] **Step 1: Extract `useOnboardingPhotoFlow` hook**

Create: `apps/mobile/src/hooks/useOnboardingPhotoFlow.ts`

```ts
import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import {
  getCompleteOnboardingUseCase,
  getSetAvatarUseCase,
} from '../services/userComposition';
import {
  pickAvatarImage,
  resizeAndUploadAvatar,
  type AvatarSource,
} from '../services/avatarUpload';

export function useOnboardingPhotoFlow() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const onboardingState = useAuthStore((s) => s.onboardingState);
  const setSession = useAuthStore((s) => s.setSession);
  const setOnboardingState = useAuthStore((s) => s.setOnboardingState);
  const [uploading, setUploading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const avatarUrl = session?.avatarUrl ?? null;
  const hasAvatar = !!avatarUrl;
  const busy = uploading || finalizing;

  const pick = async (source: AvatarSource) => {
    if (!session) return;
    setUploading(true);
    try {
      const picked = await pickAvatarImage(source);
      if (!picked) return;
      const url = await resizeAndUploadAvatar(picked, session.userId);
      await getSetAvatarUseCase().execute({ userId: session.userId, avatarUrl: url });
      setSession({ ...session, avatarUrl: url });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('העלאת התמונה נכשלה', `אפשר לדלג ולהוסיף תמונה מאוחר יותר.\n${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    if (!session) return;
    setUploading(true);
    try {
      await getSetAvatarUseCase().execute({ userId: session.userId, avatarUrl: null });
      setSession({ ...session, avatarUrl: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('הסרת התמונה נכשלה', msg);
    } finally {
      setUploading(false);
    }
  };

  const finalize = async () => {
    if (!session) return;
    setFinalizing(true);
    try {
      if (onboardingState === 'pending_avatar') {
        await getCompleteOnboardingUseCase().execute({ userId: session.userId });
        setOnboardingState('completed');
      }
      router.replace('/(onboarding)/tour');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('שמירה נכשלה', msg);
    } finally {
      setFinalizing(false);
    }
  };

  const goBack = () => {
    if (busy) return;
    router.replace('/(onboarding)/basic-info');
  };

  return {
    session,
    avatarUrl,
    hasAvatar,
    uploading,
    finalizing,
    busy,
    pick,
    remove,
    finalize,
    goBack,
  };
}
```

- [ ] **Step 2: Rewrite `photo.tsx` to use the hook + animations**

Replace `apps/mobile/app/(onboarding)/photo.tsx` with:

```tsx
// Onboarding step 3 — FR-AUTH-011 (camera+gallery, resize+upload, skip→silhouette).
import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@kc/ui';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { OnboardingStepHeader } from '../../src/components/OnboardingStepHeader';
import { PhotoSourceSheet } from '../../src/components/PhotoSourceSheet';
import { AnimatedEntry } from '../../src/components/animations/AnimatedEntry';
import { PressableScale } from '../../src/components/animations/PressableScale';
import { staggerDelay } from '../../src/lib/animations/motion';
import { useOnboardingPhotoFlow } from '../../src/hooks/useOnboardingPhotoFlow';

export default function OnboardingPhotoScreen() {
  const flow = useOnboardingPhotoFlow();
  const [sheetVisible, setSheetVisible] = useState(false);

  const openSheet = () => !flow.busy && setSheetVisible(true);
  const onPick = async (source: Parameters<typeof flow.pick>[0]) => {
    setSheetVisible(false);
    await flow.pick(source);
  };
  const onRemove = async () => { setSheetVisible(false); await flow.remove(); };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <OnboardingStepHeader
          step={3}
          onSkip={flow.finalize}
          onBack={flow.goBack}
          skipDisabled={flow.busy}
          backDisabled={flow.busy}
        />
        <AnimatedEntry delay={staggerDelay(0)}>
          <Text style={styles.title}>תמונת פרופיל</Text>
        </AnimatedEntry>
        <AnimatedEntry delay={staggerDelay(1)}>
          <Text style={styles.subtitle}>אפשר להוסיף עכשיו או בהמשך</Text>
        </AnimatedEntry>

        <AnimatedEntry delay={staggerDelay(2)} style={styles.avatarWrap}>
          <PressableScale
            onPress={openSheet}
            disabled={flow.busy}
            accessibilityRole="button"
            accessibilityLabel={flow.hasAvatar ? 'החלפת תמונת פרופיל' : 'הוספת תמונת פרופיל'}
          >
            <AvatarInitials
              name={flow.session?.displayName ?? 'משתמש'}
              avatarUrl={flow.avatarUrl}
              size={120}
            />
            {flow.uploading && (
              <View style={styles.avatarSpinner}>
                <ActivityIndicator color={colors.textInverse} size="large" />
              </View>
            )}
          </PressableScale>
        </AnimatedEntry>

        <AnimatedEntry delay={staggerDelay(3)}>
          <PressableScale
            style={[styles.changeBtn, flow.busy && { opacity: 0.5 }]}
            onPress={openSheet}
            disabled={flow.busy}
          >
            <Text style={styles.changeBtnText}>{flow.hasAvatar ? 'החלף תמונה' : 'בחר תמונה'}</Text>
          </PressableScale>
        </AnimatedEntry>

        <View style={{ flex: 1 }} />

        <AnimatedEntry delay={staggerDelay(4)}>
          <PressableScale
            style={[styles.cta, flow.busy && { opacity: 0.7 }]}
            onPress={flow.finalize}
            disabled={flow.busy}
          >
            {flow.finalizing ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.ctaText}>
                {flow.hasAvatar ? 'המשך עם התמונה הנוכחית' : 'המשך ללא תמונה'}
              </Text>
            )}
          </PressableScale>
        </AnimatedEntry>
        <AnimatedEntry delay={staggerDelay(5)}>
          <Text style={styles.hint}>אפשר להחליף תמונה מאוחר יותר בהגדרות.</Text>
        </AnimatedEntry>
      </View>

      <PhotoSourceSheet
        visible={sheetVisible}
        canRemove={flow.hasAvatar}
        onPick={onPick}
        onRemove={onRemove}
        onClose={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: spacing.base,
    gap: spacing.base,
  },
  title: { ...typography.h1, color: colors.textPrimary, textAlign: 'right' },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: spacing.lg,
  },
  avatarWrap: { alignItems: 'center', marginVertical: spacing.lg },
  avatarSpinner: {
    position: 'absolute',
    width: 120, height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  changeBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  changeBtnText: { ...typography.button, color: colors.primary },
  cta: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: { ...typography.button, color: colors.textInverse },
  hint: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
```

- [ ] **Step 3: Verify size + typecheck**

Run:
```bash
wc -l apps/mobile/app/\(onboarding\)/photo.tsx
cd app && pnpm --filter @kc/mobile typecheck && pnpm --filter @kc/mobile lint
```
Expected: file under 200 lines, type/lint PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/hooks/useOnboardingPhotoFlow.ts apps/mobile/app/\(onboarding\)/photo.tsx
git commit -m "feat(mobile): extract photo flow hook, animate entries"
```

---

## Task 10: `<TourSlidePager>` — gesture-driven carousel

**Files:**
- Create: `apps/mobile/src/components/animations/TourSlidePager.tsx`

The pager owns: horizontal swipe gesture, animated translateX, animated dots, animated slide content (emoji bounce on slide change). It receives `slides`, `index`, `onIndexChange`. The parent screen owns Next/Skip/Back buttons (so the pager stays presentational).

- [ ] **Step 1: Implement**

```tsx
// apps/mobile/src/components/animations/TourSlidePager.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, I18nManager } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors, typography, spacing } from '@kc/ui';
import { MOTION } from '../../lib/animations/motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface TourSlide {
  readonly emoji: string;
  readonly title: string;
  readonly body: string;
}

export interface TourSlidePagerProps {
  readonly slides: readonly TourSlide[];
  readonly index: number;
  readonly onIndexChange: (next: number) => void;
}

const SWIPE_THRESHOLD = 60;

export function TourSlidePager({ slides, index, onIndexChange }: TourSlidePagerProps) {
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const tx = useSharedValue(0);
  const emojiScale = useSharedValue(1);
  const direction = I18nManager.isRTL ? -1 : 1;

  useEffect(() => {
    const d = reduced ? 0 : MOTION.duration.base;
    tx.value = withTiming(0, { duration: d, easing: MOTION.easing.easeOut });
    if (!reduced) {
      emojiScale.value = 0.6;
      emojiScale.value = withSpring(1, MOTION.spring);
    }
  }, [index, reduced, tx, emojiScale]);

  const commit = (next: number) => {
    if (next < 0 || next >= slides.length) {
      tx.value = withTiming(0, { duration: MOTION.duration.fast });
      return;
    }
    onIndexChange(next);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((e) => { tx.value = e.translationX; })
    .onEnd((e) => {
      const dx = e.translationX * direction;
      if (dx < -SWIPE_THRESHOLD) runOnJS(commit)(index + 1);
      else if (dx > SWIPE_THRESHOLD) runOnJS(commit)(index - 1);
      else tx.value = withTiming(0, { duration: MOTION.duration.fast });
    });

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));
  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  const slide = slides[index]!;

  return (
    <View style={styles.wrap}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.content, trackStyle, { width }]}>
          <Animated.Text style={[styles.emoji, emojiStyle]}>{slide.emoji}</Animated.Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.body}>{slide.body}</Text>
        </Animated.View>
      </GestureDetector>
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <Dot key={i} active={i === index} />
        ))}
      </View>
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const w = useSharedValue(active ? 24 : 8);
  const c = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    const d = reduced ? 0 : MOTION.duration.base;
    w.value = withTiming(active ? 24 : 8, { duration: d, easing: MOTION.easing.easeOut });
    c.value = withTiming(active ? 1 : 0, { duration: d });
  }, [active, reduced, w, c]);

  const dotStyle = useAnimatedStyle(() => ({
    width: w.value,
    backgroundColor: c.value > 0.5 ? colors.primary : colors.border,
  }));

  return <Animated.View style={[styles.dot, dotStyle]} />;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emoji: { fontSize: 96, marginBottom: spacing.xl },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.base,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
```

- [ ] **Step 2: Typecheck**

Run: `cd app && pnpm --filter @kc/mobile typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/animations/TourSlidePager.tsx
git commit -m "feat(mobile): add gesture-driven TourSlidePager"
```

---

## Task 11: Rewire `tour.tsx` to use the pager

**Files:**
- Modify: `apps/mobile/app/(onboarding)/tour.tsx`

- [ ] **Step 1: Replace the screen body**

Full file (target ≤ 200 lines):

```tsx
// Onboarding step 4 — FR-AUTH-012
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@kc/ui';
import { OnboardingStepHeader } from '../../src/components/OnboardingStepHeader';
import { TourSlidePager, type TourSlide } from '../../src/components/animations/TourSlidePager';
import { PressableScale } from '../../src/components/animations/PressableScale';

const SLIDES: readonly TourSlide[] = [
  {
    emoji: '🎁',
    title: 'תן ובקש',
    body: 'פרסם פריטים שאתה רוצה לתת או בקש דברים שאתה צריך, תמיד אפשר גם לחפש — הכל בקהילה.',
  },
  {
    emoji: '💬',
    title: 'תאמו בצ׳אט',
    body: 'פותחים שיחה במהירות ישר דרך הפוסט, מתאמים איסוף בקלות, ומחזקים את הקהילה!',
  },
  {
    emoji: '✅',
    title: 'סמן כנמסר',
    body: 'אחרי שהפריט עבר ידיים — סמן את הפוסט כסגור. ככה כולנו רואים את הקהילה זזה.',
  },
];

export default function OnboardingTourScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) router.replace('/(tabs)');
    else setIndex(index + 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerPad}>
        <OnboardingStepHeader
          step={4}
          onSkip={() => router.replace('/(tabs)')}
          onBack={() => router.replace('/(onboarding)/photo')}
        />
      </View>
      <TourSlidePager slides={SLIDES} index={index} onIndexChange={setIndex} />
      <View style={styles.footer}>
        <PressableScale style={styles.cta} onPress={handleNext}>
          <Text style={styles.ctaText}>{isLast ? 'בואו נתחיל' : 'הבא'}</Text>
        </PressableScale>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  headerPad: { paddingHorizontal: spacing.xl, paddingTop: spacing.base },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.base },
  cta: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: { ...typography.button, color: colors.textInverse },
});
```

- [ ] **Step 2: Typecheck + lint**

Run: `cd app && pnpm --filter @kc/mobile typecheck && pnpm --filter @kc/mobile lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/\(onboarding\)/tour.tsx
git commit -m "feat(mobile): replace tour slides with gesture pager"
```

---

## Task 12: Stack-level screen transition + SSOT note

**Files:**
- Modify: `apps/mobile/app/(onboarding)/_layout.tsx`
- Modify: `docs/SSOT/TECH_DEBT.md`

- [ ] **Step 1: Tighten the Stack transition**

Replace `apps/mobile/app/(onboarding)/_layout.tsx` with:

```tsx
import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@kc/ui';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        gestureEnabled: false,
        animation: 'slide_from_right',
        animationDuration: 280,
      }}
    >
      <Stack.Screen name="about-intro" />
      <Stack.Screen name="basic-info" />
      <Stack.Screen name="photo" />
      <Stack.Screen name="tour" />
    </Stack>
  );
}
```

- [ ] **Step 2: Add a (closed) TECH_DEBT row**

Open `docs/SSOT/TECH_DEBT.md`, find the FE "Resolved" section (TD-100..149 range). Append:

```markdown
| TD-1XX | Onboarding motion polish | Closed | 2026-05-14 | Introduced `src/lib/animations/motion.ts` tokens + `useReducedMotion` hook + `AnimatedEntry` / `PressableScale` / `OnboardingProgressBar` / `TourSlidePager` primitives. Onboarding screens now use staggered entries and a gesture-driven tour pager. Honors `prefers-reduced-motion`. |
```

(Replace `1XX` with the next free FE-lane ID by scanning the file.)

- [ ] **Step 3: Typecheck**

Run: `cd app && pnpm --filter @kc/mobile typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/\(onboarding\)/_layout.tsx docs/SSOT/TECH_DEBT.md
git commit -m "feat(mobile): tighten onboarding stack transition + log tech-debt"
```

---

## Task 13: Manual verification + final gates

This is a UI feature — automated tests alone don't verify motion. Walk through this matrix on a real simulator before opening the PR.

- [ ] **Step 1: Run all gates**

Run: `cd app && pnpm typecheck && pnpm test && pnpm lint`
Expected: ALL GREEN.

- [ ] **Step 2: Start the dev server**

Run: `cd app && pnpm ios` (or `pnpm android`).

- [ ] **Step 3: Manual checklist — Reduced Motion OFF**

Use the app with `Settings → Accessibility → Motion → Reduce Motion = OFF`.
- [ ] On `about-intro`: title fades+slides up first, body+hint+link stagger in (~70ms apart), CTA appears last.
- [ ] CTA scales down to ~0.96 on press, springs back, light haptic fires.
- [ ] Tapping "המשך" pushes `basic-info` with a 280ms slide-from-right (iOS) / fade (Android).
- [ ] Progress bar grows from 25% → 50% smoothly during transition.
- [ ] On `basic-info`: form fields stagger in, CTA spring-press works.
- [ ] On `photo`: avatar circle and "Change photo" stagger in, pressing avatar gives haptic + scale.
- [ ] On `tour`: emoji spring-bounces, dots animate width (8→24px), swipe-left advances slide, swipe-right goes back, "בואו נתחיל" navigates to `(tabs)`.
- [ ] Back arrow on each screen reverses navigation; progress bar shrinks accordingly.

- [ ] **Step 4: Manual checklist — Reduced Motion ON**

Enable `Settings → Accessibility → Motion → Reduce Motion`.
- [ ] All four screens: content appears instantly (no fade/translate).
- [ ] CTA still calls `onPress` and still fires haptic, but doesn't scale.
- [ ] Tour pager: swipe still changes slide, but emoji + dots snap (no spring).
- [ ] Progress bar still updates (just instantly).

- [ ] **Step 5: Hebrew RTL sanity**

`I18nManager.isRTL` is `true` for this app. Verify in the tour:
- [ ] Swiping the slide LEFT visually advances to the next slide (the RTL flip is handled).
- [ ] Swiping RIGHT goes back. Dots highlight matches.

- [ ] **Step 6: Final commit (if any nits)**

If you spot small adjustments during manual testing (timing, distance), tweak `motion.ts` constants — they're the single source of truth — and commit:

```bash
git add apps/mobile/src/lib/animations/motion.ts
git commit -m "tune(mobile): adjust motion timing after device testing"
```

- [ ] **Step 7: Open the PR**

```bash
git push -u origin HEAD
gh pr create --base main --head "$(git branch --show-current)" \
  --title "feat(mobile): smart onboarding animations" \
  --body-file - <<'EOF'
## Summary
Adds a small motion system (tokens + 4 primitives + 1 hook) and applies staggered entry animations + gesture-driven tour to the 4-step onboarding flow. No FR AC changes — pure polish on top of FR-AUTH-018, FR-AUTH-010..012.

## Mapped to spec
- FR-AUTH-018, FR-AUTH-010, FR-AUTH-011, FR-AUTH-012 — motion polish, no AC changes.

## Changes
- New: `src/lib/animations/motion.ts` (tokens), `src/hooks/useReducedMotion.ts`
- New primitives: `AnimatedEntry`, `PressableScale`, `OnboardingProgressBar`, `TourSlidePager`
- Updated: all four onboarding screens + `OnboardingStepHeader` + stack `_layout`
- Extracted: `useOnboardingPhotoFlow` hook (so `photo.tsx` stays under the 200-line cap)

## Tests
- `pnpm typecheck` ✅
- `pnpm test` ✅ (motion tokens + reduced-motion hook unit tests)
- `pnpm lint` ✅
- Manual: walked through all 4 screens with Reduce Motion ON/OFF, verified RTL swipe direction.

## SSOT updated
- [x] `BACKLOG.md` — no change (polish on completed items)
- [x] `spec/01_auth_and_onboarding.md` — no AC changes
- [x] `TECH_DEBT.md` — TD-1XX added (Closed)

## Risk / rollout notes
Low risk. All animations honor `prefers-reduced-motion`. Reanimated v4 + gesture-handler already shipped; no new deps.
EOF
gh pr merge --auto --squash --delete-branch
gh pr checks --watch
```

---

## Self-Review

**Spec coverage:** FR-AUTH-018/010/011/012 — all four screens animated, header progress integrated, no AC changes. ✅

**Placeholder scan:** All steps include real code + exact paths. The only `1XX` placeholder is the TECH_DEBT ID (must be looked up at execution time, which is correct behavior since IDs are sequential). ✅

**Type consistency:**
- `MOTION` object keys match across `motion.ts`, `AnimatedEntry`, `PressableScale`, `OnboardingProgressBar`, `TourSlidePager`. ✅
- `TourSlide` type exported from pager, consumed by `tour.tsx`. ✅
- `useReducedMotion()` returns `boolean` everywhere it's consumed. ✅
- `useOnboardingPhotoFlow` return shape (`session`, `avatarUrl`, `hasAvatar`, `uploading`, `finalizing`, `busy`, `pick`, `remove`, `finalize`, `goBack`) matches the destructuring in `photo.tsx`. ✅

**File size cap:** Verified mentally — every modified file stays under 200 lines because animation code lives in primitives, not inline.

**Hard constraints honored:** No domain imports from infrastructure; no Supabase from `domain`/`application`; primitives use only React Native + Reanimated + theme tokens.
