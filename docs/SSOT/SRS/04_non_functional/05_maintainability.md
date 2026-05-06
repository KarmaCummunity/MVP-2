# 4.5 Maintainability

[← back to Part IV index](./README.md)

Prefix: `NFR-MAINT-*`

---

These NFRs encode the project's foundational engineering rules from the user agreement. Their primary purpose is to keep the codebase scalable for the long-term roadmap (12 donation worlds + organizations + AI assistant beyond MVP) while keeping any single change small, safe, and reviewable.

The detailed *how* of each rule (linting tools, CI scripts, Turborepo configuration) lives in `CODE_QUALITY.md`.

---

### NFR-MAINT-001 — File-size cap

**Statement.** **No** source file exceeds **200 lines** of code (excluding blank lines and comments). Files that grow beyond the cap must be split before merge.
**Measurement.** ESLint rule `max-lines` set to 200 across the monorepo; CI fails on violations.
**Source.** Project rule §3 (Quality Constraints).

### NFR-MAINT-002 — Indentation cap

**Statement.** **No** function body exceeds **3** levels of indentation.
**Measurement.** ESLint rule `max-depth` = 3.
**Source.** Project rule §3.

### NFR-MAINT-003 — Cyclomatic complexity cap

**Statement.** **No** function exceeds cyclomatic complexity **8**. High-cohesion small functions are preferred.
**Measurement.** ESLint rule `complexity` = 8 + SonarCloud as a secondary check.

### NFR-MAINT-004 — Domain layer purity

**Statement.** The `domain` package imports **zero** code from `node_modules` (other than approved utility libraries listed in `CODE_QUALITY.md`) and **zero** code from `infrastructure-*` packages. Violation fails CI.
**Measurement.** A `dependency-cruiser` config asserts the layer dependency direction `infrastructure → application → domain`.
**Source.** Project rule §2 (Clean Architecture & Boundaries), `D-3`.

### NFR-MAINT-005 — Application layer purity

**Statement.** The `application` package imports `domain` and **only** declares interfaces (ports) for infrastructure dependencies; no concrete infrastructure imports.
**Measurement.** Same `dependency-cruiser` rule.
**Source.** Project rule §2.

### NFR-MAINT-006 — Test coverage minimums

**Statement.** Coverage thresholds enforced in CI:
- `domain` package: **≥95%** statements, **≥90%** branches.
- `application` package: **≥90%** statements, **≥85%** branches.
- `infrastructure-supabase`, `ui`: **≥70%**.
- `mobile-app`, `web-app`: **≥60%** with E2E coverage on the critical paths.
**Measurement.** Jest coverage reporter + Coveralls / Codecov; CI gate.
**Source.** Project rule §4 (Testing Protocol).

### NFR-MAINT-007 — Test colocation

**Statement.** Unit tests live alongside the implementation file (`foo.ts` → `foo.test.ts`) or under a `__tests__` directory adjacent to it. Integration and E2E tests live in their own top-level directories.
**Measurement.** Convention enforced by CI script.
**Source.** Project rule §4.

### NFR-MAINT-008 — Dependency hygiene

**Statement.** Every direct production dependency must be:
- ≥ semantic-version `^1.0.0` (no `0.x` in production unless documented).
- Maintained: had a release in the last **18 months**.
- Documented in `CODE_QUALITY.md` with the rationale and the layer that owns it.
**Measurement.** Renovate + semver-range linter; `CODE_QUALITY.md` index audit at each major release.

### NFR-MAINT-009 — Public API stability for `domain` & `application`

**Statement.** Once published from a stable file, exported names from `domain` and `application` packages are versioned per semver. Breaking changes require a version bump and a `Q-*` migration entry.
**Measurement.** API extraction tool (`api-extractor`) compares snapshots.

### NFR-MAINT-010 — No comments that narrate code

**Statement.** Comments explain **non-obvious intent, trade-offs, or constraints**. Comments that restate code (`// increment counter`) are forbidden.
**Measurement.** Code review checklist; reviewer rejects narration comments.
**Source.** Project rule §3.

### NFR-MAINT-011 — TypeScript strict mode

**Statement.** Every package enables `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`. `any` is forbidden in `domain` and `application`.
**Measurement.** `tsconfig` parity check; CI lint.

### NFR-MAINT-012 — Single source of truth for enums

**Statement.** Each enum from [`03_domain_model.md`](../03_domain_model.md) §3.3 is defined exactly **once** in the `domain` package; UI / infra import that definition rather than redefining.
**Measurement.** Source-grep audit; lint rule on duplicate enum names.

### NFR-MAINT-013 — No dynamic refactoring

**Statement.** When tech debt is encountered during a feature implementation, the engineer **does not** refactor; instead, an entry `[PENDING REFACTOR]: <brief>` is appended to `CODE_QUALITY.md`. The current task remains atomic.
**Measurement.** Code review enforcement; PR template references the rule.
**Source.** Project rule §1 (Propose and Proceed).

### NFR-MAINT-014 — Atomic PRs

**Statement.** A PR contains one logical change set, ideally <300 lines of diff. Larger changes are split unless explicitly justified.
**Measurement.** PR review checklist.

### NFR-MAINT-015 — Documentation-as-code parity

**Statement.** Any change to a `FR-*`, `R-MVP-*`, or `NFR-*` requires a corresponding update to this SRS in the same PR. Missing SRS updates fail CI.
**Measurement.** A CI script checks that PRs touching `application` / `domain` files include changes under `docs/SSOT/SRS/` when functional behavior changes.

### NFR-MAINT-016 — i18n catalog drift

**Statement.** Untranslated keys for the active locales fail CI. New keys must include placeholders for all enabled locales (Hebrew at MVP).
**Measurement.** i18n linter in CI.

### NFR-MAINT-017 — Import sorting & barrel files

**Statement.** Imports are auto-sorted; barrel `index.ts` files are limited to package roots and not nested deeply.
**Measurement.** ESLint rules; PR review.

### NFR-MAINT-018 — Code formatting

**Statement.** Prettier is the single source of truth for formatting; pre-commit hook + CI check enforce zero formatting diffs.
**Measurement.** `prettier --check` in CI.

### NFR-MAINT-019 — Forbidden imports across layers

**Statement.** UI components (in `ui` package) **must not** import from `infrastructure-supabase`. They consume application-layer hooks/use-cases via a thin React adapter that injects ports.
**Measurement.** `dependency-cruiser` rule.

### NFR-MAINT-020 — Versioning of the SRS

**Statement.** This SRS uses date-based versioning at the file level via the bottom-of-file change log. Major restructurings bump a version in the top index ([`../00_meta.md`](../00_meta.md)).
**Measurement.** PR review.

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial draft. Encodes project rules into measurable maintainability NFRs. |
