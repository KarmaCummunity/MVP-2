# 4.1 Performance, Scalability & Availability

[← back to Part IV index](./README.md)

Prefixes: `NFR-PERF-*`, `NFR-SCALE-*`, `NFR-AVAIL-*`

---

## Performance — `NFR-PERF-*`

Targets are **p95** unless stated. Targets apply on a 4G mobile connection (≥2 Mbps, ≤200 ms RTT) for mobile clients and a stable home broadband (≥20 Mbps) for Web.

### NFR-PERF-001 — Cold start

**Statement.** Cold app start to interactive Splash screen within **2.5s** on mid-tier 2022 Android devices and within **2.0s** on iPhone 12 or newer; Web first-contentful-paint within **2.0s**.
**Measurement.** Synthetic Lighthouse runs (Web) and Firebase Performance Monitoring traces (mobile), aggregated daily.
**Source.** Industry baseline; PRD `06_Navigation_Structure.md` §6.6.4.
**Applies to.** iOS, Android, Web.

### NFR-PERF-002 — Feed first page

**Statement.** First feed page (20 posts) returns in **≤500 ms** server-side and renders in **≤1,200 ms** client-side from authenticated launch.
**Measurement.** Server: HTTP timings via observability platform. Client: synthetic E2E tests in CI.
**Source.** Direct UX impact on KPI #2 / #5.
**Applies to.** All platforms.

### NFR-PERF-003 — Feed subsequent pages

**Statement.** Subsequent paginated reads (`Load more`) return in **≤300 ms** server-side.
**Measurement.** Same as `NFR-PERF-002`.

### NFR-PERF-004 — Search latency

**Statement.** Free-text search returns in **≤400 ms** server-side for the typical filter set (single keyword, no filters).
**Measurement.** Server timings; load-tested under simulated 100 RPS at MVP scale.

### NFR-PERF-005 — Realtime freshness

**Statement.** New events (chat message, follow request, post visibility change) propagate to subscribed clients within **≤2,000 ms** end-to-end at p95.
**Measurement.** Synthetic Realtime probe runs every minute, recording end-to-end delay.
**Source.** UX expectation for active community; basis for `FR-FEED-009`, `FR-CHAT-003`, `FR-NOTIF-014`.

### NFR-PERF-006 — Chat send latency

**Statement.** Chat message send-to-delivery-ack within **≤500 ms** at p95.
**Measurement.** Client-side instrumentation paired with server timings.

### NFR-PERF-007 — Notification preference propagation

**Statement.** A user toggling `Critical` or `Social` notifications takes effect within **≤5,000 ms** end-to-end.
**Measurement.** Integration test that toggles, then triggers a representative event, then asserts behavior.

### NFR-PERF-008 — Image upload

**Statement.** A 4 MB image (post-resize) uploads in **≤6,000 ms** at p95 over 4G.
**Measurement.** Synthetic mobile network conditions in CI; production timing telemetry.

### NFR-PERF-009 — Push deliverability

**Statement.** **≥98%** of fan-out push deliveries succeed within **30 s** of trigger.
**Measurement.** Push provider delivery reports (FCM, APNs).
**Source.** UX baseline; PRD `R-MVP-Items-5` notification dependency.

### NFR-PERF-010 — Database query budget

**Statement.** **No** single-request domain query exceeds **150 ms** at p95 in MVP load conditions.
**Measurement.** Postgres `pg_stat_statements` extracts plus the Supabase query analyzer.
**Source.** Engineering target derived from end-to-end latency budgets.

---

## Scalability — `NFR-SCALE-*`

### NFR-SCALE-001 — User base capacity

**Statement.** The MVP must serve **10,000 registered users** with no architectural changes; the design must scale to **100,000** by adding read replicas and edge cache without code changes.
**Measurement.** Capacity test on a staging fork; `CODE_QUALITY.md` documents the linear-scale runway.

### NFR-SCALE-002 — Concurrent active users

**Statement.** **1,000** concurrently online users supported within MVP infra; sustained rate **20 RPS feed reads, 5 RPS message sends**.
**Measurement.** k6 / Locust scripts in CI.

### NFR-SCALE-003 — Realtime subscription capacity

**Statement.** **1,000** concurrent Realtime subscribers across feed and chat channels combined, without degradation > `NFR-PERF-005`.
**Measurement.** Synthetic Realtime load test.

### NFR-SCALE-004 — Storage growth budget

**Statement.** Per-user average **≤50 MB** of storage (images + DB) for the first 12 months, validated at month 6.
**Measurement.** Storage telemetry, sampled monthly.

---

## Availability — `NFR-AVAIL-*`

### NFR-AVAIL-001 — Service uptime

**Statement.** **99.5%** monthly availability for the API and Realtime endpoints (≈3.6h max downtime/month).
**Measurement.** External uptime monitor with 1-minute probes from two distinct geographies.

### NFR-AVAIL-002 — Push delivery uptime

**Statement.** **≥99.0%** of push fan-out attempts complete within `NFR-PERF-009`'s deadline, measured monthly.
**Measurement.** Push provider analytics; alert on drop below threshold.

### NFR-AVAIL-003 — Maintenance windows

**Statement.** Planned maintenance events do not exceed **30 minutes** at a time and are announced **≥24 hours** in advance via the support email and an in-app banner.
**Measurement.** Operational runbook compliance.

### NFR-AVAIL-004 — Disaster recovery RTO/RPO

**Statement.** **RTO ≤4 hours** and **RPO ≤30 minutes** in the event of database loss.
**Measurement.** Quarterly DR drill replays a recent backup into a staging environment.

### NFR-AVAIL-005 — Graceful degradation

**Statement.** When Realtime is unavailable, the app continues to function with manual refresh; when Push is unavailable, app continues, with a banner notice; when image upload fails, the user can publish without images for `Request` posts and is given a clear retry for `Give` posts.
**Measurement.** Chaos test in CI exercises each dependency outage.

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial draft. Numbers chosen for MVP scale and Israel network conditions. |
