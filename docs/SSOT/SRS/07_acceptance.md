# Part VII — Acceptance & Release Readiness

[← back to SRS index](../SRS.md) · [← back to Part VI](./06_cross_cutting/README.md)

---

## Purpose

This part defines what it means for the MVP to be **done**. It is the gate between "we built it" and "we shipped it" — a single checklist that integrates functional acceptance, non-functional thresholds, operational readiness, and policy compliance.

Each item is **verifiable**: it either passes or fails based on objective evidence, not subjective judgment.

---

## 7.1 Definition of Done (per requirement)

A `FR-*` is "Done" only if all of the following hold:

1. **Code merged.** The implementation is on the trunk, behind any rollout flag.
2. **Tests pass.** Unit tests for `domain` and `application` layers (per `NFR-MAINT-006`); integration tests for cross-aggregate flows; E2E test for at least one happy path on at least one client platform.
3. **All acceptance criteria pass.** Each `AC*` listed under the FR is asserted by automated tests where feasible, and by manual QA where automation is impractical (each manual case is documented in QA test runs).
4. **Visual & RTL parity.** Visual regression suite passes in both LTR and RTL where applicable.
5. **Accessibility audit.** The screen(s) the FR introduces or modifies pass the accessibility checks in `NFR-A11Y-*`.
6. **Telemetry.** The events listed in [`06_cross_cutting/01_analytics_and_events.md`](./06_cross_cutting/01_analytics_and_events.md) for this FR fire correctly with the right properties (verified via test).
7. **Documentation.** This SRS reflects the implemented behavior (`NFR-MAINT-015`).

---

## 7.2 Definition of Ready (for release)

The MVP is **release-ready** when the following gates pass simultaneously. Each is a binary gate.

### 7.2.1 Functional gates

- [ ] Every `FR-*` in Part II is at status "Done" per §7.1.
- [ ] No requirement has unresolved `[TODO]` markers in this SRS.
- [ ] The traceability matrix ([`appendices/A_traceability_matrix.md`](./appendices/A_traceability_matrix.md)) shows 100% coverage of `R-MVP-*` rules by FRs.
- [ ] All flows from PRD `04_User_Flows.md` (1–14) pass an end-to-end manual run on iOS, Android, and Web.

### 7.2.2 Non-functional gates

- [ ] Performance budgets in `NFR-PERF-*` met by the load-test suite at MVP scale (`NFR-SCALE-002`).
- [ ] Security checklist signed-off:
   - [ ] RLS policy fuzzer (`NFR-SEC-002`) passes with three personas.
   - [ ] Latest Dependabot scan: zero critical CVEs older than 14 days.
   - [ ] Secrets management audit: no secret in source control.
   - [ ] Backup integrity check passing (`NFR-SEC-012`).
- [ ] Privacy checklist signed-off:
   - [ ] EXIF stripping verified (`NFR-PRIV-002`).
   - [ ] Right-to-erasure (`NFR-PRIV-004`) tested end-to-end.
   - [ ] Telemetry redaction audit (`NFR-PRIV-012`) clean.
- [ ] Accessibility audit (`NFR-A11Y-*`) passing on every documented screen.
- [ ] Cross-platform parity audit (`NFR-PLAT-*`) clean.
- [ ] Maintainability gates (`NFR-MAINT-*`) passing in CI for the release commit.

### 7.2.3 Operational gates

- [ ] Observability dashboards live and populated for at least 7 days of staging traffic ([`06_cross_cutting/02_observability.md`](./06_cross_cutting/02_observability.md)).
- [ ] Alerts wired and silenced for known staging false-positives only.
- [ ] Disaster Recovery drill performed in the last 90 days; RTO/RPO met (`NFR-AVAIL-004`).
- [ ] Background jobs ([`06_cross_cutting/05_background_jobs.md`](./06_cross_cutting/05_background_jobs.md)) all green for ≥7 days in staging.
- [ ] Feature flag catalog ([`06_cross_cutting/04_feature_flags.md`](./06_cross_cutting/04_feature_flags.md)) reflects production reality.
- [ ] On-call rotation defined; runbooks linked in `CODE_QUALITY.md`.

### 7.2.4 Policy & legal gates

- [ ] Terms of Service and Privacy Policy published, accessible from in-app (`FR-SETTINGS-010`) and the public landing page.
- [ ] DPA documents in place for all sub-processors (Supabase, FCM, APNs, Twilio, email provider).
- [ ] Data residency configuration verified (EU per `NFR-PRIV-005`).
- [ ] Children's policy text live in Terms (`NFR-PRIV-006`).

### 7.2.5 Content & onboarding gates

- [ ] All Hebrew strings translated, reviewed, and approved.
- [ ] Empty states and warm onboarding content (`D-15`) match the design spec.
- [ ] Push notification copy reviewed for tone and length (`R-MVP-Items-5` and the lists in `09_notifications.md`).
- [ ] City list seeded with a documented set (the MVP launch list).
- [ ] Avatar default image and brand assets shipped.

### 7.2.6 Support readiness

- [ ] Super Admin account created and `is_super_admin = true` on the canonical email.
- [ ] Support inbox tested end-to-end (`FR-CHAT-007`, `FR-MOD-002`).
- [ ] FAQ document drafted for the 10 most likely user issues.
- [ ] Backup contact email (`FR-SETTINGS-009`) routed to a real human.

---

## 7.3 Smoke test plan (post-deploy)

After every production deploy, the team runs an automated smoke pack covering:

1. **Auth path.** Sign up via email → verify → onboard → publish a `Public` `Give` post.
2. **Read paths.** Open feed, search, filter, view post detail, view profile.
3. **Write paths.** Send a message, follow a public profile, mark a post as delivered, reopen.
4. **Push delivery.** Trigger a chat message and confirm push receipt on iOS, Android, Web Push.
5. **Realtime.** Open feed; create a post from another account; assert the new-post banner appears within 2 s.
6. **Moderation.** Submit a report; assert the system message is delivered to the Super Admin thread.
7. **Privacy.** Toggle to Private; create a `FollowersOnly` post; assert visibility from a non-follower account is blocked.
8. **Account deletion.** Delete a test account; assert all owned posts are gone within 30 minutes.

The smoke pack runs in CI on a production-like environment before production traffic is shifted; failures block the rollout.

---

## 7.4 Launch criteria & sign-off

The product is launched when:

- All gates in §7.2 are green.
- The smoke test in §7.3 passes for the release candidate.
- A go/no-go review is documented (linked to the change log of [`SRS.md`](../SRS.md)).
- The Super Admin and product owner sign off in writing.

Post-launch, the system enters a 30-day **stabilization window** during which:

- Performance and reliability are monitored daily.
- Hotfixes are allowed; new features are not.
- The team reviews the open-questions register ([`appendices/D_open_questions.md`](./appendices/D_open_questions.md)) and decides which to promote into V1.5 planning.

---

## 7.5 Continuous acceptance

After launch, every PR continues to be subject to:

- The Definition of Done in §7.1 for any new FR or modified FR.
- The maintainability gates in `NFR-MAINT-*`.
- The SRS update requirement (`NFR-MAINT-015`).

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial draft. |
