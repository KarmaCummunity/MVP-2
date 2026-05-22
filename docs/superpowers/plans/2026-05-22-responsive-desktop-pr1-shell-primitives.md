# Responsive Desktop — PR 1: Shell Primitives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the foundational layout primitives (`useBreakpoint`, `AppShell`, `NavigationRail`, `AsidePanel`, `useAside`, `SplitAuthLayout`), the `__SHELL_V2__` dev flag, the SSOT spec/decision/backlog entries, and the mobile-invariant snapshot baseline — *without* wiring anything into the live mobile chrome. Mobile is unchanged because no existing screen / layout file is touched.

**Architecture:** Pure-token + pure-hook primitives live in `@kc/ui` so they're testable in isolation under the existing jsdom + `@testing-library/react` setup. Composition components that need `expo-router` (`AppShell`, `NavigationRail`, dev preview route) live in `apps/mobile/src/components/shell/`. A dev-only feature flag (`SHELL_V2_ENABLED`) gates the dev preview route; the real shell wiring is PR 2's job.

**Tech Stack:** pnpm + Turbo monorepo, React Native + `react-native-web`, expo-router, vitest (with jsdom for component tests), `@testing-library/react`, `@expo/vector-icons` (Ionicons).

**Spec reference:** `docs/superpowers/specs/2026-05-22-responsive-desktop-design.md` §3, §4, §5, §8, §9.
**Maps to:** FR-RESP-001 (new).

---

## File map

| Path | Op | Responsibility |
|---|---|---|
| `app/packages/ui/src/theme/breakpoints.ts` | Create | `BREAKPOINTS` constant (4 named widths) + `BreakpointToken` type. |
| `app/packages/ui/src/theme/useBreakpoint.ts` | Create | Hook reading `useWindowDimensions().width` → `BreakpointToken`. |
| `app/packages/ui/src/theme/spacing.ts` | Modify | Add `shell.*` namespace keys. |
| `app/packages/ui/src/components/AsideContext.tsx` | Create | React context + `AsideProvider` + `useAside` hook. |
| `app/packages/ui/src/components/AsidePanel.tsx` | Create | Display component that reads the context and renders a 280px panel. |
| `app/packages/ui/src/__tests__/breakpoints.test.ts` | Create | Pure-constant test. |
| `app/packages/ui/src/__tests__/useBreakpoint.test.tsx` | Create | Hook test under jsdom. |
| `app/packages/ui/src/__tests__/AsideContext.test.tsx` | Create | Context + hook tests. |
| `app/packages/ui/src/__tests__/AsidePanel.test.tsx` | Create | Render tests. |
| `app/packages/ui/src/index.ts` | Modify | Export new symbols. |
| `app/apps/mobile/src/components/shell/tabs.config.ts` | Create | Shared tab definitions (extracted from `TabBar.tsx`). |
| `app/apps/mobile/src/components/TabBar.tsx` | Modify | Consume `tabs.config.ts` (behaviorally identical). |
| `app/apps/mobile/src/components/shell/NavigationRail.tsx` | Create | Right-side rail (mobile-app-specific because it uses `expo-router`). |
| `app/apps/mobile/src/components/shell/SplitAuthLayout.tsx` | Create | Split-screen wrapper for auth/onboarding (≥768 only). |
| `app/apps/mobile/src/components/shell/AppShell.tsx` | Create | Top-level composition: rail + main + optional aside, reads `shellVariant`. |
| `app/apps/mobile/src/config/environment.ts` | Modify | Add `SHELL_V2_ENABLED` flag. |
| `app/apps/mobile/app/dev/shell-preview.tsx` | Create | Dev-only route, mounted only when `SHELL_V2_ENABLED`. |
| `app/apps/mobile/src/components/shell/__tests__/AppShell.snapshot.test.tsx` | Create | 375px baseline snapshot — the mobile invariant gate. |
| `app/apps/mobile/vitest.config.ts` | Modify | Allow component tests under `src/components/shell/**` to run with jsdom. |
| `app/apps/mobile/package.json` | Modify | Add `@testing-library/react` and `jsdom` devDeps if not present. |
| `docs/SSOT/spec/14_responsive_desktop.md` | Create | New FR domain (FR-RESP-001..005). |
| `docs/SSOT/DECISIONS.md` | Modify | Append `D-RESP-001` (six foundational decisions). |
| `docs/SSOT/BACKLOG.md` | Modify | Add `RESP-001..005`; set `RESP-001` to 🟡 In progress. |
| `CLAUDE.md` | Modify | Bump spec list (13 → 14 files). |

---

## Task 0: Branch setup

- [ ] **Step 1: Fetch and branch from `dev`**

Run:
```bash
git fetch origin
git switch dev
git pull --ff-only origin dev
git switch -c feat/FR-RESP-001-shell-primitives
```

- [ ] **Step 2: Verify pre-flight gates pass on a clean tree**

Run from `/Users/navesarussi/Desktop/MVP-2/app/`:
```bash
pnpm typecheck
pnpm test
pnpm lint
```
Expected: all green. If anything fails before any edits, stop and report — that's pre-existing breakage.

---

## Task 1: SSOT spec file + DECISIONS + CLAUDE.md

**Files:**
- Create: `docs/SSOT/spec/14_responsive_desktop.md`
- Modify: `docs/SSOT/DECISIONS.md` (append)
- Modify: `CLAUDE.md` (spec list)

- [ ] **Step 1: Create the new spec file**

Create `/Users/navesarussi/Desktop/MVP-2/docs/SSOT/spec/14_responsive_desktop.md`:

```markdown
# 14 — Responsive Desktop (FR-RESP-*)

**Status:** 🟡 In progress
**Owner:** Autonomous loop
**Design doc:** `docs/superpowers/specs/2026-05-22-responsive-desktop-design.md`

This domain covers adapting the mobile app to desktop browsers (≥ 768px viewport) without regressing mobile (< 768px). Strategy and decisions captured in `D-RESP-001`.

## FR-RESP-001 — Shell primitives (foundation)

**Status:** 🟡 In progress

**ACs:**
- AC1. `@kc/ui` exports a `BREAKPOINTS` constant with four named widths (`mobile`, `tablet`, `desktop`, `wide`) and a `useBreakpoint()` hook returning the current token.
- AC2. `@kc/ui` exports an `AsideContext`, `AsideProvider`, and `useAside(render, deps)` hook. `useAside` is a no-op on mobile.
- AC3. `@kc/ui` exports an `AsidePanel` display component.
- AC4. `apps/mobile/src/components/shell/` contains `NavigationRail`, `SplitAuthLayout`, `AppShell`, and a shared `tabs.config.ts` consumed by both `TabBar` (existing) and `NavigationRail` (new).
- AC5. `SHELL_V2_ENABLED` feature flag exists in `apps/mobile/src/config/environment.ts`, defaults `false`, opt-in via `EXPO_PUBLIC_SHELL_V2=1`.
- AC6. A dev-only route at `/dev/shell-preview` mounts when `SHELL_V2_ENABLED` and showcases all four breakpoints.
- AC7. A baseline snapshot test at 375px viewport guards the mobile invariant.
- AC8. No existing screen or layout file is modified (other than the trivial `TabBar.tsx` refactor to consume `tabs.config.ts` — behavior identical).

## FR-RESP-002 — Wire shell to (tabs)

**Status:** ⏳ Planned (PR 2)

Wire `AppShell` into root `_layout.tsx`, replacing `ShellWithTabBar` with `ShellWithResponsiveChrome`. Flip `SHELL_V2_ENABLED` default to `true`.

## FR-RESP-003 — Aside panels for feed, donations, profile, search

**Status:** ⏳ Planned (PR 3)

Each screen calls `useAside(...)` with its contextual content (trending donations, suggested follows, recent searches, stats summary).

## FR-RESP-004 — Chat inbox layout

**Status:** ⏳ Planned (PR 4)

`chat/_layout.tsx` renders conversations list + active thread side-by-side at ≥768; passthrough at <768.

## FR-RESP-005 — Split-screen auth & onboarding

**Status:** ⏳ Planned (PR 5)

`SplitAuthLayout` wired into `(auth)/_layout.tsx` and `(onboarding)/_layout.tsx`.
```

- [ ] **Step 2: Append `D-RESP-001` to `DECISIONS.md`**

Read `/Users/navesarussi/Desktop/MVP-2/docs/SSOT/DECISIONS.md` first to see existing format. Then append at the bottom (or under an appropriate section header — match the file's structure):

```markdown
## D-RESP-001 — Desktop adaptation strategy (2026-05-22)

**Context.** The app renders on web via `react-native-web` but looks like a stretched phone on desktop browsers. Three high-level strategies were considered: centered phone shell (Instagram.com style), adapted side-rail (X/Twitter style), full desktop rewrite (Facebook style).

**Decision.**
1. **Strategy: adapted side rail + wider content + secondary aside panel.** Same code, additive layout primitives gated by viewport width.
2. **Shell: wide labeled rail (≥1024) + content + 280px aside panel (≥1024).** No top bar.
3. **Chat: inbox pattern (list + thread side-by-side) at ≥768.**
4. **Forms / settings: narrow centered (600px max).**
5. **Auth / onboarding: split-screen with brand panel.**
6. **Breakpoints: <768 mobile / 768–1023 tablet / 1024–1439 desktop / ≥1440 wide.**

**Consequences.**
- Mobile path stays byte-identical (hard invariant; CI snapshot at 375px guards it).
- Five-PR delivery (`RESP-001..005`); each ships independently behind the `SHELL_V2_ENABLED` flag until PR 2 flips the default.
- New shell primitives live in `@kc/ui` (pure) and `apps/mobile/src/components/shell/` (composition).
- New SSOT spec file `14_responsive_desktop.md` created (FR-RESP-*).
```

- [ ] **Step 3: Update `CLAUDE.md` spec list (13 → 14)**

In `/Users/navesarussi/Desktop/MVP-2/CLAUDE.md`, find the spec file list under "### Spec files (domain-per-file)" (around line 18–35). Add a new row:

```
├── 13_donations.md               FR-DONATE-*
└── 14_responsive_desktop.md      FR-RESP-*
```

Update the previous last-entry's tree character from `└──` to `├──`.

- [ ] **Step 4: Commit**

```bash
git add docs/SSOT/spec/14_responsive_desktop.md docs/SSOT/DECISIONS.md CLAUDE.md
git commit -m "docs(ssot): add FR-RESP domain and D-RESP-001 (responsive desktop)"
```

---

## Task 2: BACKLOG.md entries

**Files:**
- Modify: `docs/SSOT/BACKLOG.md`

- [ ] **Step 1: Read the file to find the priority section format**

Read `/Users/navesarussi/Desktop/MVP-2/docs/SSOT/BACKLOG.md`. Identify where P1 items live and what the row format looks like (status emoji, ID, title, optional notes).

- [ ] **Step 2: Add five new rows**

Add under P1 (or the section matching where new feature work is tracked):

```markdown
- 🟡 **RESP-001** — Shell primitives: `useBreakpoint`, `AppShell`, `NavigationRail`, `AsidePanel`, `SplitAuthLayout`, `SHELL_V2_ENABLED` flag, mobile invariant snapshot (FR-RESP-001)
- ⏳ **RESP-002** — Wire shell into root `_layout.tsx`, flip flag default (FR-RESP-002)
- ⏳ **RESP-003** — Aside panel content for feed, donations, profile, search (FR-RESP-003)
- ⏳ **RESP-004** — Chat inbox layout at ≥768 (FR-RESP-004)
- ⏳ **RESP-005** — Split-screen auth & onboarding (FR-RESP-005)
```

- [ ] **Step 3: Commit**

```bash
git add docs/SSOT/BACKLOG.md
git commit -m "docs(ssot): queue RESP-001..005 in backlog"
```

---

## Task 3: BREAKPOINTS constant in `@kc/ui`

**Files:**
- Create: `app/packages/ui/src/theme/breakpoints.ts`
- Create: `app/packages/ui/src/__tests__/breakpoints.test.ts`
- Modify: `app/packages/ui/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/navesarussi/Desktop/MVP-2/app/packages/ui/src/__tests__/breakpoints.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { BREAKPOINTS, type BreakpointToken } from '../theme/breakpoints';

describe('BREAKPOINTS', () => {
  it('defines four tokens in ascending order', () => {
    expect(BREAKPOINTS.mobile).toBe(0);
    expect(BREAKPOINTS.tablet).toBe(768);
    expect(BREAKPOINTS.desktop).toBe(1024);
    expect(BREAKPOINTS.wide).toBe(1440);
  });

  it('exports a union token type covering all four', () => {
    const tokens: BreakpointToken[] = ['mobile', 'tablet', 'desktop', 'wide'];
    expect(tokens).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `/Users/navesarussi/Desktop/MVP-2/app/`:
```bash
pnpm --filter @kc/ui test breakpoints
```
Expected: FAIL — `Cannot find module '../theme/breakpoints'`.

- [ ] **Step 3: Implement `breakpoints.ts`**

Create `/Users/navesarussi/Desktop/MVP-2/app/packages/ui/src/theme/breakpoints.ts`:

```typescript
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;

export type BreakpointToken = keyof typeof BREAKPOINTS;

const TOKEN_ORDER: readonly BreakpointToken[] = ['mobile', 'tablet', 'desktop', 'wide'];

export function resolveBreakpoint(width: number): BreakpointToken {
  let active: BreakpointToken = 'mobile';
  for (const token of TOKEN_ORDER) {
    if (width >= BREAKPOINTS[token]) {
      active = token;
    }
  }
  return active;
}
```

- [ ] **Step 4: Export from `index.ts`**

In `/Users/navesarussi/Desktop/MVP-2/app/packages/ui/src/index.ts`, add:

```typescript
export { BREAKPOINTS, resolveBreakpoint } from './theme/breakpoints';
export type { BreakpointToken } from './theme/breakpoints';
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm --filter @kc/ui test breakpoints
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/packages/ui/src/theme/breakpoints.ts \
        app/packages/ui/src/__tests__/breakpoints.test.ts \
        app/packages/ui/src/index.ts
git commit -m "feat(ui): add BREAKPOINTS token and resolveBreakpoint helper"
```

---

## Task 4: `useBreakpoint` hook in `@kc/ui`

**Files:**
- Create: `app/packages/ui/src/theme/useBreakpoint.ts`
- Create: `app/packages/ui/src/__tests__/useBreakpoint.test.tsx`
- Modify: `app/packages/ui/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/navesarussi/Desktop/MVP-2/app/packages/ui/src/__tests__/useBreakpoint.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBreakpoint } from '../theme/useBreakpoint';

vi.mock('react-native', async () => {
  const actual = await vi.importActual<typeof import('react-native')>('react-native');
  let width = 1280;
  return {
    ...actual,
    useWindowDimensions: () => ({ width, height: 800, scale: 1, fontScale: 1 }),
    __setMockWidth: (w: number) => { width = w; },
  };
});

import * as RN from 'react-native';
const setMockWidth = (RN as unknown as { __setMockWidth: (w: number) => void }).__setMockWidth;

describe('useBreakpoint', () => {
  beforeEach(() => { setMockWidth(1280); });

  it('returns "mobile" below 768', () => {
    setMockWidth(375);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('mobile');
  });

  it('returns "tablet" at 768', () => {
    setMockWidth(768);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('tablet');
  });

  it('returns "tablet" at 1023', () => {
    setMockWidth(1023);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('tablet');
  });

  it('returns "desktop" at 1024', () => {
    setMockWidth(1024);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('desktop');
  });

  it('returns "desktop" at 1439', () => {
    setMockWidth(1439);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('desktop');
  });

  it('returns "wide" at 1440', () => {
    setMockWidth(1440);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('wide');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @kc/ui test useBreakpoint
```
Expected: FAIL — `Cannot find module '../theme/useBreakpoint'`.

- [ ] **Step 3: Implement the hook**

Create `/Users/navesarussi/Desktop/MVP-2/app/packages/ui/src/theme/useBreakpoint.ts`:

```typescript
import { useWindowDimensions } from 'react-native';
import { resolveBreakpoint, type BreakpointToken } from './breakpoints';

export function useBreakpoint(): BreakpointToken {
  const { width } = useWindowDimensions();
  return resolveBreakpoint(width);
}
```

- [ ] **Step 4: Export from `index.ts`**

In `/Users/navesarussi/Desktop/MVP-2/app/packages/ui/src/index.ts`, append:

```typescript
export { useBreakpoint } from './theme/useBreakpoint';
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm --filter @kc/ui test useBreakpoint
```
Expected: PASS (all 6 boundary cases).

- [ ] **Step 6: Commit**

```bash
git add app/packages/ui/src/theme/useBreakpoint.ts \
        app/packages/ui/src/__tests__/useBreakpoint.test.tsx \
        app/packages/ui/src/index.ts
git commit -m "feat(ui): add useBreakpoint hook"
```

---

## Task 5: `shell.*` spacing tokens

**Files:**
- Modify: `app/packages/ui/src/theme/spacing.ts`
- Modify: `app/packages/ui/src/__tests__/theme.test.ts` (extend existing)

- [ ] **Step 1: Read the existing test file**

Read `/Users/navesarussi/Desktop/MVP-2/app/packages/ui/src/__tests__/theme.test.ts` to see the pattern. We will append a new `describe` block.

- [ ] **Step 2: Write the failing test**

Append to that test file:

```typescript
describe('spacing.shell', () => {
  it('exposes shell layout dimensions', () => {
    expect(spacing.shell.railCollapsed).toBe(60);
    expect(spacing.shell.railExpanded).toBe(220);
    expect(spacing.shell.aside).toBe(280);
    expect(spacing.shell.contentMaxWide).toBe(720);
    expect(spacing.shell.contentMaxDesktop).toBe(680);
    expect(spacing.shell.contentMaxTablet).toBe(640);
    expect(spacing.shell.contentMaxNarrow).toBe(600);
  });
});
```

Make sure `spacing` is imported at the top of the file (it should already be; if not, add `import { spacing } from '../theme/spacing';`).

- [ ] **Step 3: Run test to verify it fails**

```bash
pnpm --filter @kc/ui test theme
```
Expected: FAIL — `spacing.shell` is undefined.

- [ ] **Step 4: Extend `spacing.ts`**

Edit `/Users/navesarussi/Desktop/MVP-2/app/packages/ui/src/theme/spacing.ts`. Locate the existing `spacing` object (current keys: `xs`, `sm`, `md`, `base`, `lg`, `xl`, `2xl`, `3xl`, `4xl`). Add a new key `shell`:

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
  shell: {
    railCollapsed: 60,
    railExpanded: 220,
    aside: 280,
    contentMaxWide: 720,
    contentMaxDesktop: 680,
    contentMaxTablet: 640,
    contentMaxNarrow: 600,
  },
} as const;
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm --filter @kc/ui test theme
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/packages/ui/src/theme/spacing.ts \
        app/packages/ui/src/__tests__/theme.test.ts
git commit -m "feat(ui): add spacing.shell layout dimensions"
```

---

## Task 6: `AsideContext` + `useAside` hook in `@kc/ui`

**Files:**
- Create: `app/packages/ui/src/components/AsideContext.tsx`
- Create: `app/packages/ui/src/__tests__/AsideContext.test.tsx`
- Modify: `app/packages/ui/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/navesarussi/Desktop/MVP-2/app/packages/ui/src/__tests__/AsideContext.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Text } from 'react-native';
import { useEffect } from 'react';
import { AsideProvider, useAside, useAsideContent } from '../components/AsideContext';

function Publisher() {
  useAside(() => <Text testID="aside-content">hello aside</Text>, []);
  return null;
}

function Consumer() {
  const render = useAsideContent();
  return <>{render?.()}</>;
}

describe('AsideContext', () => {
  it('publishes content from a child and exposes it via useAsideContent', () => {
    render(
      <AsideProvider>
        <Publisher />
        <Consumer />
      </AsideProvider>
    );
    expect(screen.getByTestId('aside-content').textContent).toBe('hello aside');
  });

  it('exposes undefined when no publisher is mounted', () => {
    render(
      <AsideProvider>
        <Consumer />
      </AsideProvider>
    );
    // Nothing should render; just assert no throw and no aside content present.
    expect(screen.queryByTestId('aside-content')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @kc/ui test AsideContext
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `AsideContext`**

Create `/Users/navesarussi/Desktop/MVP-2/app/packages/ui/src/components/AsideContext.tsx`:

```typescript
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type AsideRender = () => ReactNode;

type AsideContextValue = {
  render: AsideRender | undefined;
  setRender: (render: AsideRender | undefined) => void;
};

const AsideContext = createContext<AsideContextValue | undefined>(undefined);

export function AsideProvider({ children }: { children: ReactNode }) {
  const [render, setRender] = useState<AsideRender | undefined>(undefined);
  const value = useMemo<AsideContextValue>(() => ({ render, setRender }), [render]);
  return <AsideContext.Provider value={value}>{children}</AsideContext.Provider>;
}

function useAsideContextOrThrow(): AsideContextValue {
  const ctx = useContext(AsideContext);
  if (!ctx) throw new Error('useAside / useAsideContent must be used inside <AsideProvider>');
  return ctx;
}

/**
 * Publish a render function for the active screen's aside panel.
 * On mobile, the consumer (AppShell) ignores this — but the hook
 * itself is safe to call from any screen at any breakpoint.
 */
export function useAside(render: AsideRender, deps: ReadonlyArray<unknown>): void {
  const { setRender } = useAsideContextOrThrow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useCallback(render, deps);
  useEffect(() => {
    setRender(() => memoized);
    return () => setRender(undefined);
  }, [memoized, setRender]);
}

export function useAsideContent(): AsideRender | undefined {
  return useAsideContextOrThrow().render;
}
```

- [ ] **Step 4: Export from `index.ts`**

In `/Users/navesarussi/Desktop/MVP-2/app/packages/ui/src/index.ts`, append:

```typescript
export { AsideProvider, useAside, useAsideContent } from './components/AsideContext';
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm --filter @kc/ui test AsideContext
```
Expected: PASS (both cases).

- [ ] **Step 6: Commit**

```bash
git add app/packages/ui/src/components/AsideContext.tsx \
        app/packages/ui/src/__tests__/AsideContext.test.tsx \
        app/packages/ui/src/index.ts
git commit -m "feat(ui): add AsideProvider, useAside, useAsideContent"
```

---

## Task 7: `AsidePanel` display component

**Files:**
- Create: `app/packages/ui/src/components/AsidePanel.tsx`
- Create: `app/packages/ui/src/__tests__/AsidePanel.test.tsx`
- Modify: `app/packages/ui/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/navesarussi/Desktop/MVP-2/app/packages/ui/src/__tests__/AsidePanel.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Text } from 'react-native';
import { AsideProvider, useAside } from '../components/AsideContext';
import { AsidePanel } from '../components/AsidePanel';

function Publisher() {
  useAside(() => <Text testID="aside">my aside</Text>, []);
  return null;
}

describe('AsidePanel', () => {
  it('renders nothing when no publisher is mounted', () => {
    render(
      <AsideProvider>
        <AsidePanel />
      </AsideProvider>
    );
    expect(screen.queryByTestId('aside')).toBeNull();
  });

  it('renders the published content when a publisher is mounted', () => {
    render(
      <AsideProvider>
        <Publisher />
        <AsidePanel />
      </AsideProvider>
    );
    expect(screen.getByTestId('aside').textContent).toBe('my aside');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @kc/ui test AsidePanel
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `AsidePanel`**

Create `/Users/navesarussi/Desktop/MVP-2/app/packages/ui/src/components/AsidePanel.tsx`:

```typescript
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';
import { useAsideContent } from './AsideContext';

export function AsidePanel() {
  const { colors } = useTheme();
  const render = useAsideContent();
  if (!render) return null;
  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {render()}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: spacing.shell.aside,
    padding: spacing.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
});
```

> **Note:** If `colors.border` does not exist on your `Theme` type, replace with `colors.outline` or the closest equivalent — read `app/packages/ui/src/theme/colors.ts` to confirm the exact key. Use the same key for any later component that needs a border color.

- [ ] **Step 4: Export from `index.ts`**

```typescript
export { AsidePanel } from './components/AsidePanel';
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm --filter @kc/ui test AsidePanel
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/packages/ui/src/components/AsidePanel.tsx \
        app/packages/ui/src/__tests__/AsidePanel.test.tsx \
        app/packages/ui/src/index.ts
git commit -m "feat(ui): add AsidePanel display component"
```

---

## Task 8: Extract `tabs.config.ts` from `TabBar.tsx`

**Files:**
- Create: `app/apps/mobile/src/components/shell/tabs.config.ts`
- Modify: `app/apps/mobile/src/components/TabBar.tsx`

- [ ] **Step 1: Read `TabBar.tsx`**

Read `/Users/navesarussi/Desktop/MVP-2/app/apps/mobile/src/components/TabBar.tsx` in full. Identify the array / object that defines the 5 tabs (route, label key, icon name active, icon name inactive). It's around line 101–133.

- [ ] **Step 2: Create `tabs.config.ts`**

Create `/Users/navesarussi/Desktop/MVP-2/app/apps/mobile/src/components/shell/tabs.config.ts`:

```typescript
import type { Ionicons } from '@expo/vector-icons';

export type IoniconName = keyof typeof Ionicons.glyphMap;

export type TabKey = 'home' | 'donations' | 'create' | 'search' | 'profile';

export type TabDefinition = {
  key: TabKey;
  route: string;
  labelI18nKey: string;
  iconActive: IoniconName;
  iconInactive: IoniconName;
  /** Composer ("+") is a special floating button; rail treats it the same as a labeled tab. */
  isComposer?: boolean;
};

/**
 * Canonical RTL reading order (rightmost = first / "home").
 * Both TabBar (mobile bottom) and NavigationRail (desktop side) consume this.
 */
export const TABS: readonly TabDefinition[] = [
  { key: 'profile',   route: '/(tabs)/profile',   labelI18nKey: 'tabs.profile',         iconActive: 'person',  iconInactive: 'person-outline' },
  { key: 'search',    route: '/(tabs)/search',    labelI18nKey: 'search.tabLabel',      iconActive: 'search',  iconInactive: 'search-outline' },
  { key: 'create',    route: '/(tabs)/create',    labelI18nKey: 'tabs.newPost',         iconActive: 'add',     iconInactive: 'add', isComposer: true },
  { key: 'donations', route: '/(tabs)/donations', labelI18nKey: 'donations.tabLabel',   iconActive: 'heart',   iconInactive: 'heart-outline' },
  { key: 'home',      route: '/(tabs)',           labelI18nKey: 'tabs.home',            iconActive: 'home',    iconInactive: 'home-outline' },
] as const;
```

> **Cross-check before saving:** open `TabBar.tsx` and confirm each `route`, `labelI18nKey`, `iconActive`, and `iconInactive` matches the existing code byte-for-byte. If `TabBar.tsx` uses a different label-key path (e.g., `t('navigation.home')`), match that string here.

- [ ] **Step 3: Refactor `TabBar.tsx` to consume `tabs.config.ts`**

In `/Users/navesarussi/Desktop/MVP-2/app/apps/mobile/src/components/TabBar.tsx`:

1. Add the import: `import { TABS } from './shell/tabs.config';`
2. Replace the inline tab array with a reference to `TABS`. Keep all rendering, ordering, and styling 100% identical.
3. Do **not** change any visual or behavioral output — this is a pure refactor.

- [ ] **Step 4: Verify nothing broke**

Run from `/Users/navesarussi/Desktop/MVP-2/app/`:
```bash
pnpm typecheck
pnpm --filter @kc/mobile test
```
Expected: PASS.

- [ ] **Step 5: Manual sanity check (optional but recommended)**

Run `pnpm --filter @kc/mobile web` and verify the bottom tab bar at 375px viewport looks identical to before. (Stop the dev server when done.)

- [ ] **Step 6: Commit**

```bash
git add app/apps/mobile/src/components/shell/tabs.config.ts \
        app/apps/mobile/src/components/TabBar.tsx
git commit -m "refactor(mobile): extract tabs.config.ts as shared source of truth"
```

---

## Task 9: `NavigationRail` component

**Files:**
- Create: `app/apps/mobile/src/components/shell/NavigationRail.tsx`

> **Test note.** `NavigationRail` uses `expo-router`'s `usePathname` and `router.push`. Per existing `vitest.config.ts` (lines 21–27), `src/components/**` is excluded from coverage because RNTL infrastructure is pending (TD-150). We're following that policy here: no unit test for this component. The mobile invariant snapshot in Task 14 indirectly confirms it doesn't accidentally render at <768.

- [ ] **Step 1: Implement `NavigationRail`**

Create `/Users/navesarussi/Desktop/MVP-2/app/apps/mobile/src/components/shell/NavigationRail.tsx`:

```typescript
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, useBreakpoint, useTheme, spacing } from '@kc/ui';
import { TABS, type TabDefinition } from './tabs.config';

type NavigationRailProps = {
  /** When true, render icon + label rows. When false, icon-only column. */
  expanded?: boolean;
};

export function NavigationRail({ expanded }: NavigationRailProps) {
  const bp = useBreakpoint();
  const { colors } = useTheme();
  const styles = useStyles();
  const isExpanded = expanded ?? (bp === 'desktop' || bp === 'wide');

  return (
    <View
      style={[
        styles.container,
        isExpanded ? styles.expanded : styles.collapsed,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <ScrollView>
        {TABS.map((tab) => (
          <NavigationRailItem key={tab.key} tab={tab} expanded={isExpanded} />
        ))}
      </ScrollView>
    </View>
  );
}

function NavigationRailItem({ tab, expanded }: { tab: TabDefinition; expanded: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles();
  const active = isTabActive(tab, pathname);
  const iconName = active ? tab.iconActive : tab.iconInactive;

  return (
    <Pressable
      onPress={() => router.push(tab.route)}
      style={[
        styles.item,
        expanded ? styles.itemExpanded : styles.itemCollapsed,
        active && { backgroundColor: colors.surfaceVariant ?? colors.surface },
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={t(tab.labelI18nKey)}
    >
      <Ionicons name={iconName} size={24} color={active ? colors.primary : colors.textSecondary} />
      {expanded && (
        <Text style={[styles.label, { color: active ? colors.primary : colors.text }]}>
          {t(tab.labelI18nKey)}
        </Text>
      )}
    </Pressable>
  );
}

function isTabActive(tab: TabDefinition, pathname: string | null): boolean {
  if (!pathname) return false;
  if (tab.route === '/(tabs)') return pathname === '/' || pathname.startsWith('/(tabs)') && !pathname.includes('/profile') && !pathname.includes('/search') && !pathname.includes('/donations') && !pathname.includes('/create');
  return pathname.includes(tab.route.replace('/(tabs)', ''));
}

const useStyles = makeUseStyles((theme) => ({
  container: {
    borderStartWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
  },
  expanded: { width: spacing.shell.railExpanded },
  collapsed: { width: spacing.shell.railCollapsed },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginVertical: 2,
    marginHorizontal: spacing.xs,
    borderRadius: 8,
    gap: spacing.sm,
  },
  itemExpanded: { justifyContent: 'flex-start' },
  itemCollapsed: { justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '500' },
}));
```

> **Theme key cross-check:** confirm `colors.surface`, `colors.surfaceVariant`, `colors.primary`, `colors.text`, `colors.textSecondary`, `colors.border` exist on your theme. Read `app/packages/ui/src/theme/colors.ts` and adjust names if any differ. If `surfaceVariant` does not exist, fall back to `colors.surface` with an opacity overlay (no theme change in this PR).

- [ ] **Step 2: Type-check**

```bash
pnpm typecheck
```
Expected: PASS. If theme keys are wrong, fix imports and re-run.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/components/shell/NavigationRail.tsx
git commit -m "feat(mobile): add NavigationRail component"
```

---

## Task 10: `SplitAuthLayout` component

**Files:**
- Create: `app/apps/mobile/src/components/shell/SplitAuthLayout.tsx`

- [ ] **Step 1: Implement**

Create `/Users/navesarussi/Desktop/MVP-2/app/apps/mobile/src/components/shell/SplitAuthLayout.tsx`:

```typescript
import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { makeUseStyles, useBreakpoint, useTheme, spacing } from '@kc/ui';

type SplitAuthLayoutProps = {
  children: ReactNode;
};

/**
 * Mobile (<768): renders children as-is, no layout change.
 * Desktop (>=768): 50/50 split — children (auth form) on the rail-side
 * (logical start), brand panel on the logical end side.
 */
export function SplitAuthLayout({ children }: SplitAuthLayoutProps) {
  const bp = useBreakpoint();
  const { colors } = useTheme();
  const styles = useStyles();

  if (bp === 'mobile') return <>{children}</>;

  return (
    <View style={styles.row}>
      <View style={[styles.form, { backgroundColor: colors.background }]}>
        <View style={styles.formInner}>{children}</View>
      </View>
      <View style={[styles.brand, { backgroundColor: colors.surface }]}>
        <BrandPanel />
      </View>
    </View>
  );
}

function BrandPanel() {
  return (
    <View style={brandStyles.container}>
      <Image
        source={require('../../../assets/icon.png')}
        style={brandStyles.logo}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const useStyles = makeUseStyles(() => ({
  row: { flex: 1, flexDirection: 'row' },
  form: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  formInner: { width: '100%', maxWidth: 480, padding: spacing.lg },
  brand: { flex: 1, alignItems: 'center', justifyContent: 'center' },
}));

const brandStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: spacing['2xl'] },
  logo: { width: 200, height: 200 },
});
```

> **Asset cross-check:** confirm `app/apps/mobile/assets/icon.png` exists (it should — referenced from `app.json`). If the path differs, adjust the `require(...)` accordingly.

- [ ] **Step 2: Type-check**

```bash
pnpm typecheck
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/components/shell/SplitAuthLayout.tsx
git commit -m "feat(mobile): add SplitAuthLayout (passthrough on mobile, split on >=768)"
```

---

## Task 11: `AppShell` component

**Files:**
- Create: `app/apps/mobile/src/components/shell/AppShell.tsx`

- [ ] **Step 1: Implement**

Create `/Users/navesarussi/Desktop/MVP-2/app/apps/mobile/src/components/shell/AppShell.tsx`:

```typescript
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSegments } from 'expo-router';
import { makeUseStyles, useBreakpoint, useTheme, spacing, AsidePanel, AsideProvider } from '@kc/ui';
import { NavigationRail } from './NavigationRail';

type ShellVariant = 'wide' | 'narrow';

type AppShellProps = {
  children: ReactNode;
  /** Override variant detection (used by screens that don't expose unstable_settings). */
  variant?: ShellVariant;
};

/**
 * Top-level composition for >=768px viewports on web.
 *
 * - Mobile (<768) OR non-web platform: passthrough; the existing mobile chrome
 *   in app/_layout.tsx renders its bottom TabBar instead. This component is
 *   never on the mobile render path until PR 2 wires it in.
 * - Tablet (768-1023): icon-only NavigationRail + <main>, no aside.
 * - Desktop / wide (>=1024): labeled NavigationRail + <main> + AsidePanel.
 *
 * Narrow variant caps <main> at spacing.shell.contentMaxNarrow. Used by form-style
 * screens.
 */
export function AppShell({ children, variant: variantProp }: AppShellProps) {
  const bp = useBreakpoint();
  const { colors } = useTheme();
  const styles = useStyles();
  const detectedVariant = useDetectedVariant();
  const variant = variantProp ?? detectedVariant;

  const isWebDesktop = Platform.OS === 'web' && bp !== 'mobile';
  if (!isWebDesktop) {
    return <AsideProvider>{children}</AsideProvider>;
  }

  const contentMax = pickContentMax(bp, variant);
  const showAside = bp === 'desktop' || bp === 'wide';

  return (
    <AsideProvider>
      <View style={[styles.row, { backgroundColor: colors.background }]}>
        {showAside && (
          <View style={styles.aside}>
            <AsidePanel />
          </View>
        )}
        <View style={styles.mainOuter}>
          <View style={[styles.main, { maxWidth: contentMax }]}>{children}</View>
        </View>
        <NavigationRail />
      </View>
    </AsideProvider>
  );
}

function useDetectedVariant(): ShellVariant {
  const segments = useSegments();
  // Form-style routes opt in via path matching. Update this list as screens
  // declare unstable_settings.shellVariant = 'narrow' in PRs 2..5.
  const joined = segments.join('/');
  if (joined.includes('settings')) return 'narrow';
  if (joined.includes('edit-profile')) return 'narrow';
  if (joined.includes('edit-post')) return 'narrow';
  if (joined.includes('create')) return 'narrow';
  if (joined.includes('(auth)')) return 'narrow';
  if (joined.includes('(onboarding)')) return 'narrow';
  if (joined.includes('auth/verify') || joined.includes('auth/callback')) return 'narrow';
  return 'wide';
}

function pickContentMax(
  bp: 'mobile' | 'tablet' | 'desktop' | 'wide',
  variant: ShellVariant
): number | undefined {
  if (variant === 'narrow') return spacing.shell.contentMaxNarrow;
  if (bp === 'wide') return spacing.shell.contentMaxWide;
  if (bp === 'desktop') return spacing.shell.contentMaxDesktop;
  if (bp === 'tablet') return spacing.shell.contentMaxTablet;
  return undefined;
}

const useStyles = makeUseStyles(() => ({
  row: { flex: 1, flexDirection: 'row' },
  aside: { padding: spacing.base, justifyContent: 'flex-start' },
  mainOuter: { flex: 1, alignItems: 'center' },
  main: { flex: 1, width: '100%' },
}));
```

- [ ] **Step 2: Type-check**

```bash
pnpm typecheck
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/components/shell/AppShell.tsx
git commit -m "feat(mobile): add AppShell (rail + main + aside, viewport-gated)"
```

---

## Task 12: `SHELL_V2_ENABLED` feature flag

**Files:**
- Modify: `app/apps/mobile/src/config/environment.ts`

- [ ] **Step 1: Read the file**

Read `/Users/navesarussi/Desktop/MVP-2/app/apps/mobile/src/config/environment.ts` to see the existing helpers (`isDevEnvironment`, `getAppEnvironment`, etc.) and follow the same pattern.

- [ ] **Step 2: Append the flag**

Append at the bottom of `environment.ts`:

```typescript
/**
 * Gates PR 1 dev preview (/dev/shell-preview) and (from PR 2 onward) the
 * desktop ShellWithResponsiveChrome wiring. Default OFF in production; opt-in
 * during development via EXPO_PUBLIC_SHELL_V2=1 in your .env or shell.
 */
export const SHELL_V2_ENABLED: boolean =
  (typeof __DEV__ !== 'undefined' && __DEV__) &&
  process.env['EXPO_PUBLIC_SHELL_V2'] === '1';
```

- [ ] **Step 3: Type-check**

```bash
pnpm typecheck
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/src/config/environment.ts
git commit -m "feat(mobile): add SHELL_V2_ENABLED dev flag"
```

---

## Task 13: Dev preview route `/dev/shell-preview`

**Files:**
- Create: `app/apps/mobile/app/dev/shell-preview.tsx`

- [ ] **Step 1: Implement the preview route**

Create `/Users/navesarussi/Desktop/MVP-2/app/apps/mobile/app/dev/shell-preview.tsx`:

```typescript
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useTheme, useBreakpoint, spacing } from '@kc/ui';
import { AppShell } from '../../src/components/shell/AppShell';
import { SHELL_V2_ENABLED } from '../../src/config/environment';

export default function ShellPreviewRoute() {
  if (!SHELL_V2_ENABLED) return <Redirect href="/" />;
  return <ShellPreviewScreen />;
}

function ShellPreviewScreen() {
  const bp = useBreakpoint();
  const { colors } = useTheme();
  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.h1, { color: colors.text }]}>Shell preview</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Current breakpoint: <Text style={{ fontWeight: '600' }}>{bp}</Text>
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Resize the browser window to: 375 / 800 / 1280 / 1600.
        </Text>
        <View style={styles.spacer} />
        {Array.from({ length: 30 }).map((_, i) => (
          <View
            key={i}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text }}>Sample card #{i + 1}</Text>
          </View>
        ))}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.base, gap: spacing.sm },
  h1: { fontSize: 24, fontWeight: '700' },
  body: { fontSize: 14 },
  spacer: { height: spacing.base },
  card: { borderWidth: StyleSheet.hairlineWidth, padding: spacing.base, borderRadius: 8 },
});
```

- [ ] **Step 2: Verify the route does NOT render on prod-like builds**

Run:
```bash
pnpm typecheck
```
Expected: PASS. The runtime gate (`SHELL_V2_ENABLED`) handles the rest — confirmed manually in Task 15.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/app/dev/shell-preview.tsx
git commit -m "feat(mobile): add dev-only /dev/shell-preview route"
```

---

## Task 14: Mobile invariant snapshot test

**Files:**
- Modify: `app/apps/mobile/package.json` (devDeps — only if missing)
- Create: `app/apps/mobile/src/components/shell/__tests__/AppShell.snapshot.test.tsx`

The existing `vitest.config.ts` already picks up any test under `src/**/__tests__/**/*.test.tsx`, so no config change is needed for the test to run. The `coverage.exclude: ['src/components/**']` line is intentionally left in place — coverage exclusion only affects reporting, not execution, and the existing TD-150 policy applies to all component coverage.

- [ ] **Step 1: Confirm test deps**

Read `/Users/navesarussi/Desktop/MVP-2/app/apps/mobile/package.json`. Look for `@testing-library/react` and `jsdom` in `devDependencies`. If missing, add them (use the version that `@kc/ui` uses — check `app/packages/ui/package.json` first):

```bash
pnpm --filter @kc/mobile add -D @testing-library/react jsdom
```

- [ ] **Step 2: Write the snapshot test**

Create `/Users/navesarussi/Desktop/MVP-2/app/apps/mobile/src/components/shell/__tests__/AppShell.snapshot.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Text } from 'react-native';
import { AppShell } from '../AppShell';

// Stub expo-router so the test does not need a real router context.
vi.mock('expo-router', () => ({
  useSegments: () => [],
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
  Redirect: ({ href }: { href: string }) => null,
}));

// Force the mobile breakpoint for this test.
vi.mock('react-native', async () => {
  const actual = await vi.importActual<typeof import('react-native')>('react-native');
  return {
    ...actual,
    useWindowDimensions: () => ({ width: 375, height: 812, scale: 2, fontScale: 1 }),
    Platform: { ...actual.Platform, OS: 'web' },
  };
});

describe('AppShell — mobile invariant (375px)', () => {
  it('renders only its children, no rail or aside, at 375px on web', () => {
    const { container, queryByTestId } = render(
      <AppShell>
        <Text testID="child">child content</Text>
      </AppShell>
    );
    expect(queryByTestId('child')?.textContent).toBe('child content');
    // No NavigationRail in the tree: assert the rail's accessibility role is absent.
    expect(container.querySelectorAll('[role="tab"]').length).toBe(0);
    // Baseline structural snapshot — any future change to the mobile path will
    // break this assertion and must be reviewed by hand.
    expect(container.innerHTML).toMatchSnapshot();
  });
});
```

- [ ] **Step 3: Run the test to create the baseline snapshot**

Run from `/Users/navesarussi/Desktop/MVP-2/app/`:
```bash
pnpm --filter @kc/mobile test shell
```
Expected: PASS (first run creates the snapshot file).

- [ ] **Step 4: Confirm the snapshot file was created**

Verify `/Users/navesarussi/Desktop/MVP-2/app/apps/mobile/src/components/shell/__tests__/__snapshots__/AppShell.snapshot.test.tsx.snap` exists. Commit it alongside the test.

- [ ] **Step 5: Commit**

```bash
git add app/apps/mobile/package.json \
        app/apps/mobile/src/components/shell/__tests__/AppShell.snapshot.test.tsx \
        app/apps/mobile/src/components/shell/__tests__/__snapshots__/
# pnpm-lock.yaml only if Step 1 added new deps:
[ -n "$(git diff --cached --name-only | grep pnpm-lock)" ] || git add ../pnpm-lock.yaml 2>/dev/null || true
git commit -m "test(mobile): add AppShell mobile-invariant snapshot at 375px"
```

---

## Task 15: Manual smoke test + pre-flight + PR

**Files:** none.

- [ ] **Step 1: Pre-flight gates**

Run from `/Users/navesarussi/Desktop/MVP-2/app/`:
```bash
pnpm typecheck
pnpm test
pnpm lint
```
Expected: all green. If any fails, fix in-scope before pushing.

- [ ] **Step 2: Manual smoke — mobile path unchanged**

Run `pnpm --filter @kc/mobile web`. Open the dev URL at viewport 375×812 (Chrome DevTools device mode). Verify: bottom tab pill is present and pixel-identical to before. No console errors. Stop the dev server.

- [ ] **Step 3: Manual smoke — dev preview when flag is on**

Run `EXPO_PUBLIC_SHELL_V2=1 pnpm --filter @kc/mobile web`. Open `/dev/shell-preview` and resize the browser to 375 / 800 / 1280 / 1600. Verify:
- 375: passthrough (no rail visible).
- 800: icon-only rail on the right (RTL).
- 1280: labeled rail on the right, no aside content (publishing is screen-specific; nothing to publish here).
- 1600: same as 1280, more side breathing room.
- No console errors at any size.

Stop the dev server.

- [ ] **Step 4: Push branch**

```bash
git push -u origin feat/FR-RESP-001-shell-primitives
```

- [ ] **Step 5: Open PR**

Write the PR body to `.github/.pr-body.md`:

```markdown
## Summary

Adds the foundational layout primitives for the desktop-responsive redesign without touching any existing screen or layout. Mobile is unchanged by construction (no edits to `_layout.tsx` or any screen file other than a behavior-identical `TabBar.tsx` refactor to consume the new shared `tabs.config.ts`).

Gated behind `SHELL_V2_ENABLED` (off by default; opt-in via `EXPO_PUBLIC_SHELL_V2=1`). Dev-only `/dev/shell-preview` route showcases all four breakpoints.

## Mapped to spec

- FR-RESP-001 — Shell primitives — `docs/SSOT/spec/14_responsive_desktop.md`
- Design doc: `docs/superpowers/specs/2026-05-22-responsive-desktop-design.md`
- Decision: `D-RESP-001` in `docs/SSOT/DECISIONS.md`

## Changes

- New tokens: `BREAKPOINTS`, `BreakpointToken`, `resolveBreakpoint`, `useBreakpoint`, `spacing.shell.*` in `@kc/ui`.
- New context: `AsideProvider`, `useAside`, `useAsideContent`, `AsidePanel` in `@kc/ui`.
- New components: `NavigationRail`, `SplitAuthLayout`, `AppShell` in `apps/mobile/src/components/shell/`.
- Refactor: `TabBar.tsx` now consumes shared `tabs.config.ts` (no behavior change).
- New flag: `SHELL_V2_ENABLED` in `apps/mobile/src/config/environment.ts`.
- New dev route: `/dev/shell-preview` (mounted only when flag is on).
- New SSOT: `14_responsive_desktop.md`, `D-RESP-001`, `RESP-001..005` in BACKLOG.

## Tests

- `pnpm typecheck` ✅
- `pnpm test` ✅ (new unit tests: breakpoints, useBreakpoint, AsideContext, AsidePanel, spacing.shell, AppShell mobile-invariant snapshot)
- `pnpm lint` ✅
- Manual: mobile 375px tab bar pixel-identical; `/dev/shell-preview` renders correctly at 375 / 800 / 1280 / 1600.

## SSOT updated

- [x] `BACKLOG.md` status flipped (RESP-001 → 🟡)
- [x] `spec/14_responsive_desktop.md` created with FR-RESP-001..005
- [x] `DECISIONS.md` D-RESP-001 added
- [x] `CLAUDE.md` spec list updated 13 → 14
- [ ] `TECH_DEBT.md` — none added; none closed

## Risk / rollout notes

Low risk. No existing screen or layout file is modified beyond the trivial `TabBar.tsx` consume-from-config refactor. New components are dead code outside `/dev/shell-preview` until PR 2 wires `ShellWithResponsiveChrome` into root `_layout.tsx`.
```

Then:

```bash
gh pr create --base dev --head feat/FR-RESP-001-shell-primitives \
  --title "feat(ui): add shell primitives (FR-RESP-001)" \
  --body-file .github/.pr-body.md \
  --label "FR-RESP" \
  --assignee "@me"
gh pr merge --auto --squash --delete-branch
gh pr checks --watch
```

- [ ] **Step 6: After merge, return to `dev`**

```bash
git switch dev
git pull --ff-only origin dev
git branch -D feat/FR-RESP-001-shell-primitives
```

---

## Post-merge follow-up (out of scope for this PR)

- PR 2 (`FR-RESP-002`) will replace `ShellWithTabBar` with `ShellWithResponsiveChrome` and flip `SHELL_V2_ENABLED` to default `true` in dev environments. The snapshot test from Task 14 becomes the gate that proves mobile is byte-identical when the swap happens.
- PRs 3 / 4 / 5 each get their own plan under `docs/superpowers/plans/`.
