# 4.4 Reliability & Cross-Platform

[← back to Part IV index](./README.md)

Prefixes: `NFR-RELI-*`, `NFR-PLAT-*`

---

## Reliability — `NFR-RELI-*`

### NFR-RELI-001 — API error rate

**Statement.** **<0.5%** of API requests fail with 5xx errors over any rolling 24-hour window in production.
**Measurement.** Server-side metric `api_requests_total{status="5xx"} / api_requests_total`.

### NFR-RELI-002 — Idempotency

**Statement.** All write endpoints accept a client-generated `idempotency_key` and guarantee that retries with the same key produce one server-side effect.
**Measurement.** Integration test that submits a write twice and asserts a single side effect.
**Applies to.** Post create / edit, message send, follow, follow-request, report, block, recipient mark.

### NFR-RELI-003 — Optimistic UI rollback

**Statement.** Every optimistic UI update has a deterministic rollback path on server failure that returns the visible state to its pre-action snapshot within **2 s** of the failure response.
**Measurement.** Component-level unit tests; integration tests with simulated server errors.

### NFR-RELI-004 — Offline tolerance

**Statement.** While offline:
- Reading the last-cached feed and the user's own profile is allowed.
- Composing a draft post is allowed (`FR-POST-007`).
- Sending messages is queued and retried on reconnect with backoff (jittered, max **5 attempts**, max **5 minutes** total).
- All other writes are gracefully refused with a clear "You're offline" indicator.
**Measurement.** Airplane-mode integration test; chaos test cutting the network mid-action.

### NFR-RELI-005 — Drift & invariant alerts

**Statement.** Domain invariants (counters, RLS-equivalent guards) are validated nightly by a recompute job; **any** drift triggers an SRE alert and is auto-reconciled.
**Measurement.** `bg-job-stats-recompute` instrumentation; alert routing.
**Source.** `FR-CLOSURE-009`, `FR-STATS-005`.

### NFR-RELI-006 — Background job reliability

**Statement.** Scheduled background jobs (post expiry, soft-delete cleanup, token prune, stats recompute) succeed at **≥99%** per execution; failures are retried with exponential backoff up to **3** retries before alerting.
**Measurement.** Job runner metrics.
**Source.** [`06_cross_cutting/05_background_jobs.md`](../06_cross_cutting/05_background_jobs.md).

### NFR-RELI-007 — Crash-free sessions

**Statement.** Mobile crash-free sessions **≥99.5%** rolling 7-day; Web error-free sessions **≥99.0%**.
**Measurement.** Sentry / Crashlytics dashboards.

### NFR-RELI-008 — Build reproducibility

**Statement.** Production builds are reproducible from a tagged commit. Two builds of the same commit produce byte-equivalent JS bundles.
**Measurement.** CI compares two consecutive builds of the same commit.
**Source.** `CODE_QUALITY.md` (build pipeline).

### NFR-RELI-009 — Data integrity on transactional flows

**Statement.** Every multi-aggregate operation (closure, reopen, block, account deletion, profile-mode flip) executes within a single database transaction at the application layer; partial commits are not allowed.
**Measurement.** Integration tests inject failures mid-flow and assert no partial state.
**Source.** `Part III §3.6`.

### NFR-RELI-010 — Deployment safety

**Statement.** Deployments are zero-downtime via blue-green; a failed deployment auto-rolls-back within **5 minutes**.
**Measurement.** Deployment dashboard.

---

## Cross-Platform — `NFR-PLAT-*`

### NFR-PLAT-001 — Three-platform parity at launch

**Statement.** iOS, Android, and Web each support **every** functional requirement listed as `Applies to: All platforms` (default). Platform-specific deviations (Apple SSO on iOS, camera capture on mobile) are explicitly listed in the relevant FR.
**Measurement.** Platform-coverage matrix in [`appendices/A_traceability_matrix.md`](../appendices/A_traceability_matrix.md).
**Source.** `R-MVP-Core-7`, `D-1`.

### NFR-PLAT-002 — Supported OS / browser versions

**Statement.** iOS 15+, Android 9+ (API 28), Chrome 100+, Safari 14+, Firefox 100+, Edge 100+. Older versions are **rejected** at app launch / page load with a clear message.
**Measurement.** App-store minimums; Web detection script.
**Source.** PRD `06_Navigation_Structure.md` §6.6.5.

### NFR-PLAT-003 — Responsive design

**Statement.** UI adapts at the breakpoints defined in PRD `06_Navigation_Structure.md` §6.6.2:
- Mobile small (<375 px), Mobile (375–767 px), Tablet (768–1024 px), Desktop (1025–1440 px), Desktop large (>1440 px).
**Measurement.** Visual regression suite at each breakpoint.

### NFR-PLAT-004 — Web navigation pattern parity

**Statement.** On Web at ≥1024 px, the bottom tab bar is replaced with a sidebar that exposes the same destinations and quick actions; nothing is hidden.
**Measurement.** Visual + interaction tests.
**Source.** PRD `06_Navigation_Structure.md` §6.6.3.

### NFR-PLAT-005 — Push parity

**Statement.** All Critical and Social notifications listed in [`02_functional_requirements/09_notifications.md`](../02_functional_requirements/09_notifications.md) deliver on iOS, Android, and Web with identical semantics.
**Measurement.** Push-delivery integration tests for each platform.
**Source.** `R-MVP-Core-7`, `D-2`.

### NFR-PLAT-006 — Deep-link parity

**Statement.** Universal Links (iOS) / App Links (Android) / Web URLs (browser) all route to the same surface for a given canonical URL. A user without the app on mobile is offered to install; a user with the app deep-links into the screen.
**Measurement.** Deep-link integration test on each platform.
**Source.** [`05_external_interfaces.md`](../05_external_interfaces.md) §5.7.

### NFR-PLAT-007 — Camera-only on mobile

**Statement.** "Capture from camera" is exposed only on iOS and Android; Web shows "Upload from device" only.
**Measurement.** Platform-conditional rendering covered by tests.
**Source.** PRD `06_Navigation_Structure.md` §6.6.3.

### NFR-PLAT-008 — Keyboard shortcuts (Web only)

**Statement.** On Web, keyboard shortcuts are provided for:
- `/` — focus the feed search bar.
- `c` — open Inbox.
- `n` — open the Create Post screen.
- `g h` — go to Home.
- `g p` — go to My Profile.
- `g s` — go to Settings.
**Measurement.** Keyboard-only Cypress / Playwright test.
**Source.** PRD `06_Navigation_Structure.md` §6.6.3.

### NFR-PLAT-009 — Web service-worker scope

**Statement.** The Web service worker enables Web Push (`FR-NOTIF-015`) and offline asset caching of the app shell. It does **not** cache user-specific data beyond the runtime cache budget (50 MB).
**Measurement.** Service-worker audit; size monitor.

### NFR-PLAT-010 — Backwards compatibility for stored URLs

**Statement.** All canonical URLs (profile share, post detail, deep links) remain stable across MVP releases; removed routes return a 410 with a clear UI explanation, never a generic 404.
**Measurement.** URL inventory in CI.

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial draft. |
