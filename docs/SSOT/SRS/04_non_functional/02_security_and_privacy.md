# 4.2 Security & Privacy

[← back to Part IV index](./README.md)

Prefixes: `NFR-SEC-*`, `NFR-PRIV-*`

---

## Security — `NFR-SEC-*`

### NFR-SEC-001 — Transport security

**Statement.** All client-server traffic uses TLS 1.2+; HSTS is enforced on Web; certificate pinning is **not** used in MVP (deferred to V1.5+).
**Measurement.** SSL Labs grade ≥ A on every public endpoint, weekly scan.
**Applies to.** All platforms.

### NFR-SEC-002 — Authorization at the data layer

**Statement.** Every read and write to the database is gated by Postgres Row-Level Security (RLS) policies that mirror the SRS visibility/ownership rules. The application layer is **never** the sole guardian; bypassing the UI must not leak protected data.
**Measurement.** A "policy fuzzer" CI job runs with three synthetic personas (owner, follower, stranger) and asserts forbidden reads/writes return zero rows.
**Source.** `INV-V1`, `INV-V2`, `INV-V4`, `FR-MOD-009`.

### NFR-SEC-003 — Authentication token storage

**Statement.** Session tokens are stored in OS-secure storage on each platform: Keychain (iOS), EncryptedSharedPreferences (Android), HTTP-only Secure SameSite=Strict cookies (Web). No token is ever serialized into JS-accessible storage.
**Measurement.** Static-analysis check (lint rule) + manual code review.
**Source.** `FR-AUTH-007`.

### NFR-SEC-004 — Token rotation

**Statement.** Access tokens rotate every **60 minutes**; refresh tokens rotate on every use. Old refresh tokens are revoked on first reuse (replay detection).
**Measurement.** Audit log inspection in synthetic test harness; periodic security review.

### NFR-SEC-005 — OTP brute-force protection

**Statement.** **≤5** OTP verification attempts per challenge; **≤3** OTP send requests per phone number per hour; **≤10** per IP per hour.
**Measurement.** Server logs sampled into the security dashboard; alerts on abuse patterns.
**Source.** `FR-AUTH-005`.

### NFR-SEC-006 — Password storage

**Statement.** Passwords are hashed with Argon2id (memory ≥64 MB, iterations ≥3, parallelism 1). No legacy hashes are accepted.
**Measurement.** Code review of auth backend; periodic rehash if parameters strengthen.

### NFR-SEC-007 — Image content scanning

**Statement.** Uploaded images pass a basic content scan (MIME sniff, decode-and-fail for malformed images, EXIF strip, optional CSAM scan via third party in V1.5+).
**Measurement.** Edge function pipeline metrics; deferred CSAM scanning logged as `Q-*` in [`appendices/D_open_questions.md`](../appendices/D_open_questions.md).
**Source.** `FR-POST-005`, `NFR-PRIV-002`.

### NFR-SEC-008 — Admin operations require strong auth

**Statement.** All operations gated by `User.is_super_admin` are additionally gated by the requirement that the session was created within the last **24 hours**. After 24 hours the admin must re-authenticate to perform admin actions.
**Measurement.** Server-side middleware check; integration test.
**Source.** `FR-ADMIN-006`.

### NFR-SEC-009 — Rate limiting

**Statement.** Global rate limits apply: **120 requests/minute** per user, **600 requests/minute** per IP, **10 chat messages/second** per user, **5 reports/hour** per user.
**Measurement.** Edge function counters with sliding-window enforcement; metrics dashboard.

### NFR-SEC-010 — Anti-CSRF (Web)

**Statement.** State-changing endpoints require a `SameSite=Strict` cookie + an `X-CSRF-Token` header that the server validates against the session.
**Measurement.** Penetration test suite in CI.

### NFR-SEC-011 — Dependency hygiene

**Statement.** Daily Dependabot / Renovate scan; **no** known critical CVEs in production dependencies older than 14 days.
**Measurement.** GitHub security advisories dashboard.

### NFR-SEC-012 — Backup integrity

**Statement.** Database backups are taken **every 6 hours** with point-in-time recovery (PITR) enabled. Backups are encrypted at rest with a key separate from production credentials.
**Measurement.** Backup integrity check runs nightly; key rotation policy documented in `CODE_QUALITY.md`.
**Source.** `NFR-AVAIL-004`.

### NFR-SEC-013 — Logging hygiene

**Statement.** Application logs **never** contain plaintext passwords, OTP codes, push tokens, raw email/phone of users (mask everything except last 4 digits / hash). Server logs are retained for 30 days; longer retention requires an explicit `Q-*`.
**Measurement.** Static lint rule + log sampling audit weekly.
**Source.** `R-MVP-Privacy-7`.

---

## Privacy — `NFR-PRIV-*`

### NFR-PRIV-001 — Minimum data collection

**Statement.** The system collects **only** data necessary for product operation as listed in the data dictionary ([`appendices/B_glossary.md`](../appendices/B_glossary.md)). Additional collection requires a `Q-*` and an SRS amendment.
**Measurement.** Annual privacy review; compliance with this list audited at every PR that touches `User` or `Post` schemas.
**Source.** `R-MVP-Privacy-7`.

### NFR-PRIV-002 — EXIF stripping on images

**Statement.** Image uploads have all EXIF and IPTC metadata stripped server-side before storage. No location data is retained from photos.
**Measurement.** Pipeline metric `images_exif_stripped_total`; sampled image inspection in QA.
**Source.** `FR-POST-005`, `R-MVP-Safety-4`.

### NFR-PRIV-003 — Right to access (GDPR Article 15 / Israeli Privacy Law)

**Statement.** A user can request a complete export of their data via support; the export is delivered within **30 days** as a structured JSON file.
**Measurement.** Compliance tracker; the operational runbook documents the data-extraction script.

### NFR-PRIV-004 — Right to erasure

**Statement.** Account deletion is the canonical erasure mechanism; it executes per `FR-SETTINGS-012`. After the 30-day cooldown, all PII is purged or fully anonymized; cryptographically irreversible removal is the goal.
**Measurement.** Deletion script verifies row counts post-purge; nightly job alerts on residual PII.
**Source.** `FR-SETTINGS-012`, `R-MVP-Privacy-6`.

### NFR-PRIV-005 — Data residency

**Statement.** Personal data is stored in EU regions (Supabase EU instance). No PII is shipped to providers outside EU/USA without explicit DPA.
**Measurement.** Quarterly DPA inventory.

### NFR-PRIV-006 — Children policy

**Statement.** The product does **not** verify age in MVP (`R-MVP-Core-3`). The Terms of Service forbid use by anyone under 14, and any report citing under-age use triggers immediate review.
**Measurement.** Terms of Service review; moderation runbook.
**Source.** `R-MVP-Core-3`.

### NFR-PRIV-007 — Third-party tracking

**Statement.** **No** third-party advertising or behavioral-tracking SDKs in MVP. Analytics is first-party only; see [`06_cross_cutting/01_analytics_and_events.md`](../06_cross_cutting/01_analytics_and_events.md).
**Measurement.** Build-time check that excluded packages are absent.

### NFR-PRIV-008 — Personal data masking in support thread

**Statement.** When a user reports an issue from Settings, the system message visible to the Super Admin contains the user's identity (necessary to respond) but never the user's password, full email/phone, or device push token.
**Measurement.** Schema review of `Message.system_payload`.
**Source.** `FR-MOD-002`, `NFR-SEC-013`.

### NFR-PRIV-009 — Block opacity

**Statement.** A blocked user receives **zero** signal that they were blocked. Their messages appear sent locally, follows fail with neutral errors, and reports are accepted normally without feedback.
**Measurement.** Behavioral test cases per surface.
**Source.** `R-MVP-Privacy-3`, `FR-MOD-003`, `FR-CHAT-003`.

### NFR-PRIV-010 — Reject opacity

**Statement.** A user whose follow request was rejected receives **zero** signal of the rejection. The UI shows a generic cooldown notice without disclosing the reason.
**Measurement.** Behavioral test cases.
**Source.** `R-MVP-Privacy-12`, `FR-FOLLOW-006`.

### NFR-PRIV-011 — Address handling

**Statement.** The full address is stored once on `Post.address` and projected to viewers per `Post.location_display_level`. Viewers must not be able to derive the hidden parts (street number when the level is `CityAndStreet`, etc.) by querying directly.
**Measurement.** RLS policy review; integration tests across viewer/owner permutations.
**Source.** `FR-POST-019`, `R-MVP-Privacy-1`.

### NFR-PRIV-012 — Telemetry redaction

**Statement.** Analytics events never include `display_name`, `email`, `phone`, `address`, or message content. They include hashed IDs and category labels only.
**Measurement.** Schema check against the event taxonomy in [`06_cross_cutting/01_analytics_and_events.md`](../06_cross_cutting/01_analytics_and_events.md).

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial draft. Standards aligned with Israeli Privacy Law and GDPR baseline. |
