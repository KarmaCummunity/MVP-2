# 00 — Document Meta, Conventions, and Change Log

[← back to SRS index](../SRS.md)

---

## 0.1 Purpose & Scope

This file defines the rules for reading and editing the SRS. It is normative for everyone touching the document.

The SRS describes Karma Community **MVP only** — the product scope frozen in `PRD_MVP/`. Anything found in `PRD_V2_NOT_FOR_MVP/` is explicitly out of scope and must not appear here.

The SRS is the contract. The PRD is the source of product intent. The code is the implementation. When they disagree:

| Conflict | Resolution |
| -------- | ---------- |
| SRS vs ad-hoc PR / Slack / chat | SRS wins. |
| SRS vs PRD on **product intent** (what users should experience) | PRD wins; update SRS to match and append a change-log entry. |
| SRS vs PRD on **engineering scope** (what we will actually build first) | SRS wins; the PRD is a wish; the SRS is a commitment. |
| SRS vs CODE_QUALITY.md | They must not overlap. SRS is "what". CODE_QUALITY is "how". If they collide, file an entry under [`appendices/D_open_questions.md`](./appendices/D_open_questions.md). |
| Code vs SRS | Code is wrong unless an SRS update is committed first. |

---

## 0.2 Identifier Schema

Every requirement and decision in this SRS has a stable, machine-grep-able identifier. Identifiers are **forever**: never renumber, never reuse.

### Functional Requirements: `FR-{DOMAIN}-{NNN}`

| Domain | Prefix | Examples |
| ------ | ------ | -------- |
| Authentication & Onboarding | `FR-AUTH-` | `FR-AUTH-001` |
| Profile & Privacy | `FR-PROFILE-` | `FR-PROFILE-014` |
| Following | `FR-FOLLOW-` | `FR-FOLLOW-007` |
| Posts (CRUD, discovery) | `FR-POST-` | `FR-POST-022` |
| Closure & Reopen | `FR-CLOSURE-` | `FR-CLOSURE-003` |
| Feed, Search, Filters | `FR-FEED-` | `FR-FEED-011` |
| Chat | `FR-CHAT-` | `FR-CHAT-005` |
| Moderation | `FR-MOD-` | `FR-MOD-009` |
| Notifications | `FR-NOTIF-` | `FR-NOTIF-002` |
| Statistics | `FR-STATS-` | `FR-STATS-004` |
| Settings | `FR-SETTINGS-` | `FR-SETTINGS-006` |
| Super Admin | `FR-ADMIN-` | `FR-ADMIN-001` |

Numbers are zero-padded to 3 digits and assigned monotonically within a file.

### Business Rules: `R-MVP-{TOPIC}-{N}` *(inherited from PRD)*

These are **kept verbatim** from the PRD (`PRD_MVP/07_Business_Rules.md`) to preserve historical traceability. Examples: `R-MVP-Privacy-9`, `R-MVP-Items-12`. Whenever an `FR-*` is bound by a `R-MVP-*` rule, the `FR-*` lists it under `Source` and `Constraints`.

### Non-Functional Requirements: `NFR-{TOPIC}-{NNN}`

| Topic | Prefix |
| ----- | ------ |
| Performance | `NFR-PERF-` |
| Scalability | `NFR-SCALE-` |
| Availability | `NFR-AVAIL-` |
| Security | `NFR-SEC-` |
| Privacy & Compliance | `NFR-PRIV-` |
| Accessibility | `NFR-A11Y-` |
| Internationalization | `NFR-I18N-` |
| Reliability | `NFR-RELI-` |
| Cross-Platform | `NFR-PLAT-` |
| Maintainability | `NFR-MAINT-` |

### Decisions: `D-{N}`

Sequential, monotonic. Logged in [`appendices/C_decisions_log.md`](./appendices/C_decisions_log.md).

### Open Questions: `Q-{N}`

Sequential, monotonic. Logged in [`appendices/D_open_questions.md`](./appendices/D_open_questions.md). When resolved, the `Q-*` becomes a `D-*` and stays linked.

---

## 0.3 Requirement Anatomy

Every functional requirement (`FR-*`) follows this exact structure. Deviations are not allowed.

```markdown
### FR-{DOMAIN}-{NNN} — {Short Title}

**Description.**
One paragraph stating what the system must do, observable from the user's perspective.

**Source.**
- PRD: `PRD_MVP/{file}.md` §{section}
- Business Rules: `R-MVP-{Topic}-{N}` (one per line)
- Decisions: `D-{N}` (if any)

**Acceptance Criteria.**
- AC1. Testable predicate.
- AC2. Testable predicate.
- ...

**Edge Cases.**
- Bullet list of non-happy-path behaviors and their expected outcomes.

**Constraints.**
- Bullet list of `R-MVP-*` rules that bound this requirement.

**Related.**
- Screens: §{N.M} of `PRD_MVP/05_Screen_UI_Mapping.md`
- Domain: entity / value object / use case names from [`03_domain_model.md`](./03_domain_model.md)
- Tests: high-level test scenario IDs (defined in [`07_acceptance.md`](./07_acceptance.md))
```

Acceptance Criteria must be **testable**. Verbs like *"feels intuitive"* or *"is fast"* are forbidden. Numeric thresholds, observable states, and explicit error codes are required.

---

## 0.4 Non-Functional Requirement Anatomy

```markdown
### NFR-{TOPIC}-{NNN} — {Short Title}

**Statement.**
A single, measurable target.

**Measurement.**
How it is verified — synthetic test, production metric, audit, etc.

**Source.**
- PRD or industry baseline reference
- Decisions: `D-{N}` (if any)

**Applies to.**
- Bullet list of platforms / surfaces (mobile, web, both).
```

---

## 0.5 Document Cross-Linking

- All internal links use **relative paths** so the docs work both on a local clone and on GitHub.
- File names are lowercase, snake_case, prefixed with a numeric ordering hint.
- Headings inside each file follow `#` for the file title, `##` for sections, `###` for individual requirements.

---

## 0.6 Out-of-Scope Forbidden List

The following must **never** appear inside this SRS. They belong elsewhere.

| Topic | Belongs in |
| ----- | ---------- |
| SQL DDL, table definitions, indexes, constraints | `CODE_QUALITY.md` |
| Repository / use-case interface signatures (TypeScript code) | `CODE_QUALITY.md` |
| Component file paths inside `apps/mobile/` or `apps/web/` | Codebase, not docs |
| Specific NPM dependencies & versions | `CODE_QUALITY.md` |
| RLS policy bodies | `CODE_QUALITY.md` |
| CI/CD pipeline definitions | `CODE_QUALITY.md` |
| Twelve future "donation worlds" beyond Items | `PRD_V2_NOT_FOR_MVP/` |

The SRS only states **what data exists**, **what behavior is required**, and **what the externally observable contract is**.

---

## 0.7 Change Log

| Version | Date | Author | Summary |
| ------- | ---- | ------ | ------- |
| 0.1 | 2026-05-05 | Initial drafting | First creation of the SRS structure based on `PRD_MVP/` v1.2. |

When you change a requirement, append a row to the **per-file** change log at the bottom of that file (every Part-II/IV/VI file ends with a `## Change Log` heading). The top-level entry above only tracks structural milestones.

---

## 0.8 Verification Gate (Project Rule)

Per project rules, every code change must declare in its commit / PR / response prefix:

```
Mapped to SRS: [Requirement ID]. Refactor logged: [Yes / No / NA].
```

`Requirement ID` is one of `FR-*`, `R-MVP-*`, `NFR-*`. `NA` is allowed only for tooling, scaffolding, or documentation changes that touch no behavior.

---

*Next: [`01_vision_and_personas.md`](./01_vision_and_personas.md)*
