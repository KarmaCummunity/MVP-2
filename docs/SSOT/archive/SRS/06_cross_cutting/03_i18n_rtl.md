# 6.3 Internationalization & RTL

[← back to Part VI index](./README.md)

---

## Purpose

Hebrew is the only shipped language at MVP launch. The architecture must let us add other languages in V1.5+ without schema or domain changes. RTL is a first-class layout concern, not an afterthought.

The measurable NFRs (`NFR-I18N-*`) are in [`../04_non_functional/03_accessibility_i18n.md`](../04_non_functional/03_accessibility_i18n.md). This file describes the **mechanism** and **content management** rules.

---

## 6.3.1 Locale strategy

- Active locales at MVP: `he-IL` only.
- Architectural-only locales (kept building-clean for fast V1.5 enablement): `en-US`.
- Locale resolution: explicit user preference (set in Settings → reserved for V1.5) > OS locale > default `he-IL`.
- All client surfaces use the same locale resolution; a user is not "half English half Hebrew".

The `User` model carries a `locale_preference` column (V1.5); the MVP UI does not expose it but the server respects it if present.

---

## 6.3.2 Translation catalog

- File format: **ICU MessageFormat** stored as JSON, one file per locale per package.
- Catalogs live in `packages/ui/i18n/{locale}.json` and `apps/*/i18n/{locale}.json` for app-specific strings.
- Keys are **hierarchical** and **describe meaning, not text**: `posts.create.button.publish`, not `posts.create.button.publish_post`.
- Catalogs are loaded eagerly on app launch; lazy chunking is reserved for V1.5+.

### Library

A single i18n library is used (chosen in `CODE_QUALITY.md`; expected: `i18next` with `react-i18next` adapter for parity across React Native and React Web). The application layer must not import from this library directly; UI components consume a thin `useT()` hook that the application layer can stub in tests.

### Conventions

- Every string in the UI uses a translation key, even single words ("OK", "Cancel"). Hardcoded literals fail CI (`NFR-I18N-002`).
- Plural and gender forms use ICU select / plural categories. Hebrew `one`/`other`/`many` plural rules are honored.
- Variable interpolation: only **named** parameters, never positional.
- Date / number formatting uses `Intl.*` APIs rather than custom formats.

---

## 6.3.3 RTL implementation

### Layout

- The HTML / Web root carries `dir="rtl"` when the active locale is RTL; React Native uses `I18nManager.isRTL`.
- Layout primitives use **logical** start/end (e.g., `marginInlineStart`) instead of physical left/right.
- Icons that imply direction (back arrow, swipe, "next") are mirrored automatically by the design system.

### Bidirectional text

- Mixed-direction strings (Hebrew + English brand names) wrap LTR substrings with Unicode marks (U+202A LRE / U+202C PDF) where needed (`NFR-I18N-006`).
- Phone numbers, monetary values, and IDs are always LTR even in RTL contexts.

### Lists & feeds

- Card layouts mirror correctly: avatar on the right, action menu on the left in RTL.
- Time stamps appear after the metadata block in reading direction.

### Animations

- Slide-in / slide-out animations use logical direction tokens; in RTL they reverse automatically.

### Testing

- Visual regression suite runs at both `dir="ltr"` and `dir="rtl"` for every shared component.
- Snapshot tests for navigation include RTL parity assertions.

---

## 6.3.4 Content management

### Editorial copy

- Product copy is owned by the design / product team in a shared spreadsheet, then sync'd into the catalog by a one-way import script.
- Tone: warm, community-oriented, lower-case where Hebrew morphology allows; never robotic, never overly formal.
- Validate readability against the persona profiles in [`../01_vision_and_personas.md`](../01_vision_and_personas.md) §1.3.

### Marketing copy

- Out of scope of the MVP product surface; if introduced in V1.5+, it lives in a separate catalog namespace `marketing.*`.

### Legal copy

- Terms of Service and Privacy Policy are kept in their own `legal.*` namespace and edited only with sign-off (`FR-SETTINGS-010`).
- Effective date drives whether re-acknowledgment is required (`FR-AUTH-002`).

### City names

- The seeded `City` table includes both `name_he` and `name_en` columns.
- Display chooses the column matching the active locale.

---

## 6.3.5 Pluralization examples

```
# he.json
"feed.unread_messages": "{count, plural, =0 {אין הודעות חדשות} one {הודעה חדשה אחת} two {שתי הודעות חדשות} other {# הודעות חדשות}}"

# en.json (architectural-only at MVP)
"feed.unread_messages": "{count, plural, =0 {No new messages} one {# new message} other {# new messages}}"
```

Hebrew plurals carry `one`, `two`, `many`, `other`; the engine resolves the right one for each integer.

---

## 6.3.6 Accessibility & RTL

- Screen readers honor the active locale's reading direction; this is automatic if `dir` and `lang` are set correctly on root elements.
- Accessibility labels are translated keys, not raw text.
- Focus order in Web mirrors logical reading order (right-to-left in RTL).

---

## 6.3.7 Adding a new locale

The procedure for adding a new locale (e.g., Arabic in V2):

1. Add `ar` to the supported locales list.
2. Create `i18n/ar.json` with all keys from `i18n/he.json`.
3. Run the i18n drift CI to ensure no missing keys (`NFR-MAINT-016`).
4. Add city `name_ar` columns and migrate the seed data.
5. Update Settings UI to surface the new option.
6. QA visual / RTL parity checks.

No domain or schema changes are required.

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial draft. Hebrew-only at MVP, English architectural-ready. |
