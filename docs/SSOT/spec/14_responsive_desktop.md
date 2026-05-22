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
