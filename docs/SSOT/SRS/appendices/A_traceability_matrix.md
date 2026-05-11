# Appendix A — Traceability Matrix

[← back to SRS index](../../SRS.md) · [← back to Part VII](../07_acceptance.md)

---

## Purpose

A bidirectional map between:

- PRD business rules (`R-MVP-*`) → the SRS requirements that satisfy them.
- SRS requirements (`FR-*` / `NFR-*`) → the PRD rule(s) and decision(s) that motivate them.

This matrix is the **proof of completeness**. Acceptance gate §7.2.1 requires 100% coverage of `R-MVP-*` rules.

---

## A.1 R-MVP → FR / NFR mapping

### Core rules

| Rule | Statement (short) | Satisfied by |
| ---- | ----------------- | ------------ |
| R-MVP-Core-1 | English-only profile (no display name in Hebrew not required) — *(deprecated/no rule found in MVP)* | n/a |
| R-MVP-Core-2 | Guest mode = read-only with sign-up CTA | `FR-AUTH-013`, `FR-AUTH-014`, `FR-FEED-012` |
| R-MVP-Core-3 | No age verification at MVP | `NFR-PRIV-006` |
| R-MVP-Core-4 | Hebrew RTL is the launch locale; EN architectural-ready | `NFR-I18N-001`..`NFR-I18N-005`, `NFR-I18N-007` |
| R-MVP-Core-5 | Asia/Jerusalem time zone | `NFR-I18N-004` |
| R-MVP-Core-7 | iOS, Android, Web parity | `NFR-PLAT-001`..`NFR-PLAT-007`, `D-1` |

### Items rules

| Rule | Statement | Satisfied by |
| ---- | --------- | ------------ |
| R-MVP-Items-1 | Required fields per type | `FR-POST-002` |
| R-MVP-Items-2 | Canonical 10 categories | `FR-POST-003` (AC2) |
| R-MVP-Items-3 | Owner can edit / delete | `FR-POST-008`, `FR-POST-010` |
| R-MVP-Items-4 | Closure semantics & counter rules | `FR-CLOSURE-001`..`FR-CLOSURE-009`, `FR-STATS-002` |
| R-MVP-Items-5 | 300-day expiry, 7-day warning | `FR-POST-013`, `FR-NOTIF-005` |
| R-MVP-Items-6 | Reopen allowed | `FR-CLOSURE-005` |
| R-MVP-Items-7 | 5+ reopens triggers suspect flag | `FR-CLOSURE-010`, `FR-MOD-008` |
| R-MVP-Items-8 | Active-posts limit (20) | `FR-POST-011`, `INV-L1` |
| R-MVP-Items-9 | Forbidden categories advisory | `FR-POST-020` |
| R-MVP-Items-10 | Forbidden keywords advisory | `FR-POST-020` |
| R-MVP-Items-11 | Single creation form with toggle | `FR-POST-001` |
| R-MVP-Items-12 | Visibility predicate per role | `FR-FOLLOW-012`, `INV-V1`, `INV-V2` |
| R-MVP-Items-13 | Address required | `FR-POST-002` (AC3) |
| R-MVP-Items-14 | OnlyMe counts toward limit | `FR-PROFILE-013`, `FR-POST-011` (AC3) |

### Profile rules

| Rule | Statement | Satisfied by |
| ---- | --------- | ------------ |
| R-MVP-Profile-1 | Edit profile fields | `FR-PROFILE-007` |
| R-MVP-Profile-2 | Follow / follow request semantics | `FR-FOLLOW-001`..`FR-FOLLOW-006` |
| R-MVP-Profile-3 | Follow blocked when blocked relationship | `FR-FOLLOW-001` (edge case); `FR-MOD-009` deferred per `EXEC-9` |
| R-MVP-Profile-6 | Bio URL filter | `FR-PROFILE-014` |
| R-MVP-Profile-7 | No algorithmic feed | `FR-FEED-001` (AC3) |
| R-MVP-Profile-8 | No friends-only toggle | (excluded; see PRD §8) |
| R-MVP-Profile-9 | Privacy toggle resides in Settings | `FR-PROFILE-005`, `FR-SETTINGS-003` |
| R-MVP-Profile-10 | Approve/reject/cancel/remove follower semantics | `FR-FOLLOW-005`..`FR-FOLLOW-006`, `FR-FOLLOW-009` |

### Privacy rules

| Rule | Statement | Satisfied by |
| ---- | --------- | ------------ |
| R-MVP-Privacy-1 | Address visibility per `LocationDisplayLevel` | `FR-POST-019`, `NFR-PRIV-011` |
| R-MVP-Privacy-3 | Block bilateral invisibility & opacity | `FR-MOD-003`, `FR-MOD-009`, `NFR-PRIV-009` — **all deferred post-MVP per `EXEC-9`** |
| R-MVP-Privacy-4 | Reports are private to admin | `FR-MOD-001`, `NFR-PRIV-008` |
| R-MVP-Privacy-4a | Issue reports do not auto-remove | `FR-MOD-002` (AC5) |
| R-MVP-Privacy-5 | 3-report auto-remove | `FR-MOD-005` |
| R-MVP-Privacy-6 | Right to erasure | `FR-SETTINGS-012`, `NFR-PRIV-004` |
| R-MVP-Privacy-7 | Minimum data collection | `NFR-PRIV-001`, `NFR-SEC-013` |
| R-MVP-Privacy-8 | Persisted feed filters | `FR-FEED-005` |
| R-MVP-Privacy-9 | Visibility upgrade-only | `FR-POST-009`, `INV-V3` |
| R-MVP-Privacy-10 | False-report sanctions | `FR-MOD-010`, `D-13` |
| R-MVP-Privacy-11 | Private profile gates lists | `FR-PROFILE-003`, `FR-PROFILE-010`, `INV-V4` |
| R-MVP-Privacy-12 | Reject is silent + cooldown | `FR-FOLLOW-006`, `NFR-PRIV-010` |
| R-MVP-Privacy-13 | Privacy switch non-retroactive | `FR-PROFILE-005` (AC4), `INV-V5` |

### Chat rules

| Rule | Statement | Satisfied by |
| ---- | --------- | ------------ |
| R-MVP-Chat-1 | 1-on-1 only | `FR-CHAT-002`, `INV-L3` |
| R-MVP-Chat-2 | Text only | `FR-CHAT-002` (AC3) |
| R-MVP-Chat-3 | Restricted entry points | `FR-CHAT-008`, `FR-CHAT-005`..`FR-CHAT-007` |
| R-MVP-Chat-4 | Auto-message on post-anchored chat | `FR-CHAT-005` |
| R-MVP-Chat-5 | Read receipts always on | `FR-CHAT-011` |

### Safety rules

| Rule | Statement | Satisfied by |
| ---- | --------- | ------------ |
| R-MVP-Safety-3 | Audit logging for sensitive actions | [`06_cross_cutting/06_audit_trail.md`](../06_cross_cutting/06_audit_trail.md) |
| R-MVP-Safety-4 | EXIF stripping on uploaded images | `NFR-PRIV-002`, `FR-POST-005` (AC4) |

---

## A.2 Decisions → Coverage

| Decision | Subject | Where it lives |
| -------- | ------- | -------------- |
| D-1 | Three-platform single codebase via RNW | `NFR-PLAT-001`..`NFR-PLAT-007` |
| D-2 | Supabase backend | [`05_external_interfaces.md`](../05_external_interfaces.md) |
| D-3 | Clean Architecture monorepo | `NFR-MAINT-004`, `NFR-MAINT-005`, `NFR-MAINT-019` |
| D-4 | Phone-method optional in MVP | `FR-AUTH-004` |
| D-5 | Two notification categories | `FR-NOTIF-014`, [`02_functional_requirements/09_notifications.md`](../02_functional_requirements/09_notifications.md) |
| D-6 | Reopen silently decrements recipient counter | `FR-CLOSURE-005`, `FR-NOTIF-013` |
| D-7 | Recipient may un-mark themselves | `FR-CLOSURE-007`, `FR-NOTIF-010` |
| D-8 | Cold-start nationwide fallback | `FR-FEED-007` |
| D-9 | First-post nudge as dismissible card | `FR-FEED-015` |
| D-10 | Soft gate after skipped onboarding | `FR-AUTH-015` |
| D-11 | Unblock restores visibility | `FR-MOD-004` — superseded by `EXEC-9` |
| EXEC-9 | Block / unblock removed from MVP | `FR-MOD-003`, `FR-MOD-004`, `FR-MOD-009`, `NFR-PRIV-009`, `INV-M1`, `FR-SETTINGS-005` (all deferred); `FR-MOD-010` relocated to P1.3 |
| D-12 | Two-step delete confirmation | `FR-SETTINGS-012` (AC1) |
| D-13 | Graduated false-report sanctions | `FR-MOD-010` |
| D-14 | Deleted user → "Deleted user" placeholder | `FR-CHAT-013` |
| D-15 | Warm empty states | `FR-FEED-008`, `FR-PROFILE-001` (AC), `FR-FOLLOW-007` (AC) |

---

## A.3 FR → Source mapping (sample)

The complete reverse map is generated automatically from each FR's `Source` block. A spot-check sample to validate the format:

| FR | Source PRD § | Constraints | Decisions |
| -- | ------------ | ----------- | --------- |
| FR-AUTH-002 | 3.1.2 | R-MVP-Core-2 | D-2, D-4 |
| FR-POST-009 | 3.2.4-ו | R-MVP-Privacy-9, R-MVP-Items-12 | — |
| FR-CLOSURE-005 | 3.3.6-ב | R-MVP-Items-6 | D-6 |
| FR-FOLLOW-006 | 3.2.4-ב | R-MVP-Privacy-12 | — |
| FR-CHAT-013 | — | R-MVP-Privacy-6 | D-14 |
| FR-NOTIF-014 | 3.5 | — | D-5 |
| FR-MOD-010 | — | R-MVP-Privacy-10 | D-13 |

---

## A.4 Open questions vs. requirements

The open questions in [`D_open_questions.md`](./D_open_questions.md) are linked to the FR/NFR they would clarify or amend. None of them block MVP launch as currently specified; resolving them adjusts behavior without breaking the contract.

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial mapping. |
