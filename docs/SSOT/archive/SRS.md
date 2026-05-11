# Software Requirements Specification — Karma Community MVP

| Field | Value |
| ----- | ----- |
| **Project** | Karma Community |
| **Phase** | MVP (v1) |
| **Document Status** | SSOT — actively maintained |
| **Owner** | Product / Engineering |
| **Last Updated** | 2026-05-05 |
| **Source PRD** | [`PRD_MVP_CORE_SSOT/`](./PRD_MVP_CORE_SSOT/00_Index.md) |
| **Companion Doc** | [`CODE_QUALITY.md`](./CODE_QUALITY.md) — architecture, patterns, tech debt |

---

## Purpose of this Document

This SRS defines **what** Karma Community MVP must do — its functional behavior, business invariants, non-functional qualities, external interfaces, and verification criteria.

It is the **Single Source of Truth (SSOT)** for engineering work. Every implementation task must trace back to a requirement here. Every business rule from the PRD is formalized in this SRS with a stable identifier that can be referenced in code, commits, PRs, and tests.

The SRS deliberately separates **what** (this document) from **how** (the companion `CODE_QUALITY.md` — architecture and patterns). When a requirement reads ambiguously, the PRD wins for product intent; this SRS wins for engineering scope.

---

## How to Use this SRS

The document is intentionally split across many small, focused files connected by relative links. The entry point is this file (`SRS.md`). From here, navigate to the part that interests you.

When citing a requirement (in code comments, commit messages, PR titles, or tests), use the canonical identifier — for example `FR-POST-014` or `R-MVP-Privacy-9`. Never paraphrase: the identifier is the contract.

Per the verification protocol in `AGENTS.md` / project rules, every code change must declare:

```
Mapped to SRS: [Requirement ID]. Refactor logged: [Yes / No / NA].
```

---

## Table of Contents

### Front Matter

- [`SRS/00_meta.md`](./SRS/00_meta.md) — conventions, ID schema, change log, document maintenance rules

### Part I — Product Vision & Stakeholders

- [`SRS/01_vision_and_personas.md`](./SRS/01_vision_and_personas.md) — vision, KPIs, personas & roles, glossary entry, out-of-scope summary

### Part II — Functional Requirements

| Domain | File | Prefix |
| ------ | ---- | ------ |
| Index | [`02_functional_requirements/README.md`](./SRS/02_functional_requirements/README.md) | — |
| Authentication & Onboarding | [`02_functional_requirements/01_auth_and_onboarding.md`](./SRS/02_functional_requirements/01_auth_and_onboarding.md) | `FR-AUTH-*` |
| Profile & Privacy Mode | [`02_functional_requirements/02_profile_and_privacy.md`](./SRS/02_functional_requirements/02_profile_and_privacy.md) | `FR-PROFILE-*` |
| Following & Follow Requests | [`02_functional_requirements/03_following.md`](./SRS/02_functional_requirements/03_following.md) | `FR-FOLLOW-*` |
| Posts: Create / Edit / Discover | [`02_functional_requirements/04_posts.md`](./SRS/02_functional_requirements/04_posts.md) | `FR-POST-*` |
| Posts: Closure & Reopen | [`02_functional_requirements/05_closure_and_reopen.md`](./SRS/02_functional_requirements/05_closure_and_reopen.md) | `FR-CLOSURE-*` |
| Feed, Search & Filters | [`02_functional_requirements/06_feed_and_search.md`](./SRS/02_functional_requirements/06_feed_and_search.md) | `FR-FEED-*` |
| Direct Messaging | [`02_functional_requirements/07_chat.md`](./SRS/02_functional_requirements/07_chat.md) | `FR-CHAT-*` |
| Reports & Moderation | [`02_functional_requirements/08_moderation.md`](./SRS/02_functional_requirements/08_moderation.md) | `FR-MOD-*` |
| Notifications | [`02_functional_requirements/09_notifications.md`](./SRS/02_functional_requirements/09_notifications.md) | `FR-NOTIF-*` |
| Personal & Community Stats | [`02_functional_requirements/10_statistics.md`](./SRS/02_functional_requirements/10_statistics.md) | `FR-STATS-*` |
| Settings | [`02_functional_requirements/11_settings.md`](./SRS/02_functional_requirements/11_settings.md) | `FR-SETTINGS-*` |
| Super Admin (in-chat) | [`02_functional_requirements/12_super_admin.md`](./SRS/02_functional_requirements/12_super_admin.md) | `FR-ADMIN-*` |
| Donations Hub | [`02_functional_requirements/13_donations.md`](./SRS/02_functional_requirements/13_donations.md) | `FR-DONATE-*` |

### Part III — Domain Model

- [`SRS/03_domain_model.md`](./SRS/03_domain_model.md) — entities, value objects, relationships, lifecycle state machines, domain invariants

### Part IV — Non-Functional Requirements

| Topic | File | Prefix |
| ----- | ---- | ------ |
| Index | [`04_non_functional/README.md`](./SRS/04_non_functional/README.md) | — |
| Performance, Scalability, Availability | [`04_non_functional/01_performance_scalability_availability.md`](./SRS/04_non_functional/01_performance_scalability_availability.md) | `NFR-PERF-*`, `NFR-SCALE-*`, `NFR-AVAIL-*` |
| Security & Privacy | [`04_non_functional/02_security_and_privacy.md`](./SRS/04_non_functional/02_security_and_privacy.md) | `NFR-SEC-*`, `NFR-PRIV-*` |
| Accessibility & Localization | [`04_non_functional/03_accessibility_i18n.md`](./SRS/04_non_functional/03_accessibility_i18n.md) | `NFR-A11Y-*`, `NFR-I18N-*` |
| Reliability & Cross-Platform | [`04_non_functional/04_reliability_platform.md`](./SRS/04_non_functional/04_reliability_platform.md) | `NFR-RELI-*`, `NFR-PLAT-*` |
| Maintainability | [`04_non_functional/05_maintainability.md`](./SRS/04_non_functional/05_maintainability.md) | `NFR-MAINT-*` |

### Part V — External Interfaces

- [`SRS/05_external_interfaces.md`](./SRS/05_external_interfaces.md) — Supabase services, push, deep links, third-party integrations

### Part VI — Cross-Cutting Concerns

| Topic | File |
| ----- | ---- |
| Index | [`06_cross_cutting/README.md`](./SRS/06_cross_cutting/README.md) |
| Analytics & Event Taxonomy | [`06_cross_cutting/01_analytics_and_events.md`](./SRS/06_cross_cutting/01_analytics_and_events.md) |
| Observability | [`06_cross_cutting/02_observability.md`](./SRS/06_cross_cutting/02_observability.md) |
| Internationalization & RTL | [`06_cross_cutting/03_i18n_rtl.md`](./SRS/06_cross_cutting/03_i18n_rtl.md) |
| Feature Flags | [`06_cross_cutting/04_feature_flags.md`](./SRS/06_cross_cutting/04_feature_flags.md) |
| Background Jobs | [`06_cross_cutting/05_background_jobs.md`](./SRS/06_cross_cutting/05_background_jobs.md) |
| Audit Trail | [`06_cross_cutting/06_audit_trail.md`](./SRS/06_cross_cutting/06_audit_trail.md) |

### Part VII — Acceptance & Verification

- [`SRS/07_acceptance.md`](./SRS/07_acceptance.md) — KPI measurement plan, test coverage requirements, definition of done

### Appendices

- [`appendices/A_traceability_matrix.md`](./SRS/appendices/A_traceability_matrix.md) — FR ↔ R-MVP-* ↔ Screen ↔ Test mapping
- [`appendices/B_glossary.md`](./SRS/appendices/B_glossary.md) — Hebrew/English terminology
- [`appendices/C_decisions_log.md`](./SRS/appendices/C_decisions_log.md) — every product/architecture decision with rationale
- [`appendices/D_open_questions.md`](./SRS/appendices/D_open_questions.md) — known gaps, future considerations

---

## Top-Level Decisions Already Captured

The following architectural and product decisions are **fixed** for the MVP. Their full rationale lives in [`appendices/C_decisions_log.md`](./SRS/appendices/C_decisions_log.md).

| ID | Decision | Domain |
| -- | -------- | ------ |
| D-1 | Cross-platform unified codebase: Expo + Dev Client + React Native Web | Tech |
| D-2 | Backend: Supabase (Auth, Postgres+RLS, Storage, Realtime, Edge Functions) | Tech |
| D-3 | Architecture: Clean Architecture in a Turborepo monorepo (`domain` / `application` / `infrastructure-supabase` / `ui` / `mobile-app` / `web-app`) | Tech |
| D-4 | SRS scope: balanced — functional requirements, NFRs, external interfaces, data dictionary; **DDL and architecture patterns belong in `CODE_QUALITY.md`** | Process |
| D-5 | Notifications: 2 categories (Critical, Social) with separate user toggles | Product |
| D-6 | Reopen of a recipient-marked post: silently decrements the recipient's "items received" counter; recipient sees the post return to "active" via their listing | Product |
| D-7 | Recipient may un-mark themselves: triggers a notification to the post owner and decrements owner's "items given" counter | Product |
| D-8 | Cold start: empty city feed falls back to nationwide with explicit banner and clearable chip | Product |
| D-9 | First-post nudge: dismissible card on the home feed for users who haven't yet posted | Product |
| D-10 | Onboarding skip: name + city are required before the first meaningful action (post creation, sending the first message) — soft gate, not a hard block | Product |
| D-11 | Block→Unblock restores prior visibility (B's older posts become visible to A again) | Product |
| D-12 | Account deletion → re-registration with the same identifier requires 30-day cooldown | Product |
| D-13 | False-report sanctions escalate: 7 days → 30 days → permanent | Product |
| D-14 | Deleted account leaves chat history visible to the other party with a "Deleted user" placeholder | Product |
| D-15 | Empty states are warm and CTA-driven (not neutral) across feed, chat list, follower list, my-posts | Product |
| D-16 | Reintroduce dedicated **Donations** and **Search** tabs in the bottom bar (5 tabs total). Search ships as a placeholder; universal-search engine deferred to end-of-MVP. | Product / Navigation |

---

## Document Maintenance

- **Authoritative location**: `docs/SSOT/SRS.md` and `docs/SSOT/SRS/`. No other location may hold conflicting requirements.
- **Change discipline**: every edit to a requirement must update both the requirement text and its entry in [`appendices/A_traceability_matrix.md`](./SRS/appendices/A_traceability_matrix.md).
- **Versioning**: requirement IDs are stable forever. Deprecated requirements are marked `[DEPRECATED-vX]` but never deleted or renumbered.
- **Conflict resolution**: SRS overrides ad-hoc PRs. PRD overrides SRS for product intent. Code overrides nothing — code must conform.

---

*See [`SRS/00_meta.md`](./SRS/00_meta.md) for full conventions and the change log.*
