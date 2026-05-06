# 4.3 Accessibility & Internationalization

[← back to Part IV index](./README.md)

Prefixes: `NFR-A11Y-*`, `NFR-I18N-*`

---

## Accessibility — `NFR-A11Y-*`

The MVP targets a baseline accessibility level so that the product is usable to users with screen readers, keyboard-only navigation, and elevated-contrast preferences. Full WCAG 2.1 AA compliance is the engineering goal; documented exceptions are tracked as `Q-*`.

### NFR-A11Y-001 — Color contrast

**Statement.** Text and meaningful UI elements meet WCAG 2.1 AA contrast ratios: **4.5:1** for body text, **3.0:1** for large text and UI components.
**Measurement.** Design system tokens are validated by an automated contrast checker in CI.
**Applies to.** All platforms.

### NFR-A11Y-002 — Screen reader labels

**Statement.** Every interactive element exposes a non-empty accessibility label. Decorative-only elements set their accessibility role to `none`.
**Measurement.** Lint rule in the UI package; manual audit per release with VoiceOver (iOS) and TalkBack (Android).
**Source.** Industry baseline; PRD `06_Navigation_Structure.md` §6.6.4 (touch target size).

### NFR-A11Y-003 — Touch target size

**Statement.** Minimum touch target size **44×44 dp** on mobile, **24×24 px** with 8 px spacing on Web.
**Measurement.** Lint rule in the UI package + visual review.
**Source.** PRD `06_Navigation_Structure.md` §6.6.3.

### NFR-A11Y-004 — Keyboard navigation (Web)

**Statement.** Every interactive element on Web is reachable and operable by keyboard alone, in a logical tab order, with a visible focus indicator.
**Measurement.** Cypress / Playwright keyboard-only test in CI; manual review.

### NFR-A11Y-005 — Reduced motion

**Statement.** Animations longer than **300 ms** respect the OS-level "Reduce Motion" preference; if enabled, animations are reduced to fades or are removed.
**Measurement.** Manual review with the OS toggle on; integration test asserting reduced motion paths.

### NFR-A11Y-006 — Dynamic type

**Statement.** Body text scales at least **200%** without truncation or overlapping; layouts use container-based sizing that grows with text.
**Measurement.** Visual regression at 100%, 150%, 200% accessibility text settings.

### NFR-A11Y-007 — Color is not the sole signal

**Statement.** State distinctions (e.g., type badges 🎁 / 🔍, visibility badges, read receipts) use **icon + label** in addition to color.
**Measurement.** Design audit; UI package lint rule for badge components.

### NFR-A11Y-008 — Form errors

**Statement.** Validation errors are announced via the platform's accessibility API and visually marked next to the offending field with text, not just color.
**Measurement.** Manual review with screen reader; component test.

### NFR-A11Y-009 — Captioning of media

**Statement.** N/A in MVP (no video). Reserved.

### NFR-A11Y-010 — Time-out warnings

**Statement.** When an OTP or password reset is about to expire, a clear text warning is shown ≥30 s before expiry; the user may extend by re-requesting.
**Measurement.** Manual review.

---

## Internationalization — `NFR-I18N-*`

Hebrew is the only shipped language at MVP launch (`R-MVP-Core-4`). The architecture must accept additional languages with no schema or domain changes.

### NFR-I18N-001 — RTL parity

**Statement.** Every screen renders correctly in RTL: layout mirroring of icons that imply direction (back arrow, swipe gestures), bidirectional text handling, correct alignment of mixed Hebrew/English content.
**Measurement.** Visual regression with `dir="rtl"` for Web; explicit RTL snapshot tests for mobile.
**Source.** `R-MVP-Core-4`, PRD `06_Navigation_Structure.md` §6.5.

### NFR-I18N-002 — String externalization

**Statement.** **Zero** user-facing strings live in source code; every string is a key in a translation catalog.
**Measurement.** Lint rule that fails on hardcoded strings inside JSX/TSX.
**Source.** `R-MVP-Core-4`.

### NFR-I18N-003 — ICU MessageFormat support

**Statement.** Plurals, gender, and parameter substitution use ICU MessageFormat. Hebrew plural rules and gender are honored.
**Measurement.** Translation catalog uses an ICU-aware library; sample assertions in CI.

### NFR-I18N-004 — Locale-aware formatting

**Statement.** Dates, times, numbers, and relative timestamps render via the platform's `Intl` API with the active locale and `Asia/Jerusalem` time zone (`R-MVP-Core-5`).
**Measurement.** Component tests for relative timestamp rendering.

### NFR-I18N-005 — Future English readiness

**Statement.** Adding `en-US` requires only a new translation catalog plus updated city display names; no domain or NFR changes.
**Measurement.** A "skeleton" English catalog is maintained in CI to prevent string drift; missing keys fail the build.
**Source.** `R-MVP-Core-4` future-readiness clause.

### NFR-I18N-006 — Mixed-language safety

**Statement.** When a user inputs LTR content (e.g., a brand name) inside an otherwise RTL field, rendering uses Unicode direction marks to prevent visual reordering ambiguity.
**Measurement.** Manual review with mixed strings.

### NFR-I18N-007 — Push notification localization

**Statement.** Notifications are localized in the user's preferred language (Hebrew at MVP). The notification dispatcher resolves the locale at fan-out time, not at event creation, to handle locale changes between trigger and delivery.
**Measurement.** Integration test that toggles locale and triggers a notification.

### NFR-I18N-008 — Date input restrictions

**Statement.** No free-text date inputs in MVP UI. The product surfaces only relative timestamps and uses ISO 8601 internally.
**Measurement.** UI package convention; PR review checklist.

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial draft. Hebrew RTL is shipped; English is architectural-only. |
