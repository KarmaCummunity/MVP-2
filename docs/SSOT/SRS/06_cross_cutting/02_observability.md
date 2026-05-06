# 6.2 Observability

[← back to Part VI index](./README.md)

---

## Purpose

The MVP must be operable: developers and on-call engineers can answer "what is happening, why is it slow, what is failing?" within minutes. This document specifies the **logs, metrics, traces, dashboards, and alerts** required at launch.

The implementation choice (Datadog, Grafana Cloud, Sentry, or Supabase's built-ins) is documented in `CODE_QUALITY.md`. The contracts here are technology-neutral.

---

## 6.2.1 Logs

### Structure

All server logs are **structured JSON**, single line per event:

```
{
  "ts": ISO 8601,
  "level": "trace" | "debug" | "info" | "warn" | "error" | "fatal",
  "service": "edge-function-name" | "postgres" | ...,
  "request_id": uuid,
  "user_id_hash": sha256(user_id) | null,
  "event": "compact verb-noun string",
  "context": object,
  "error": { "type", "message", "stack" } | null
}
```

### Levels

- `trace` — extremely detailed, off in production.
- `debug` — debug context for staging.
- `info` — successful business operations (`post_created`, `chat_message_delivered`).
- `warn` — recovered failures or unusual conditions (retry succeeded, cooldown applied).
- `error` — domain or infra error returned to the client.
- `fatal` — process-level catastrophic failure.

### Hygiene

- **No PII** (`NFR-SEC-013`).
- Hash user IDs as `sha256` truncated to 16 hex chars when correlation is needed but identification is not.
- Retention: 30 days.

### Client logs

Client-side logs (mobile + web) flow into the same observability platform via the analytics Edge Function with a `level >= warn` filter. `error` logs include a sanitized component path.

---

## 6.2.2 Metrics

### Application metrics (RED model)

For every endpoint:

- **Rate** — requests per second.
- **Errors** — error count and rate (5xx and known domain errors).
- **Duration** — p50/p95/p99 latency.

### Business metrics

- `posts_created_total{type, visibility, category}` (counter)
- `posts_closed_delivered_total` (counter) — feeds the **North Star**.
- `chats_started_total{from}` (counter)
- `messages_sent_total` (counter)
- `follows_total{type=public|private}` (counter)
- `reports_submitted_total{target_type, reason}` (counter)
- `users_active_concurrent` (gauge) — derived from Realtime subscription count.

### Infrastructure metrics

- Postgres connection count, slow queries, lock waits.
- Realtime channel count, dropped subscriptions.
- Storage upload throughput and error rate.
- Edge Function cold starts and durations.

### Cardinality discipline

- Labels are bounded: type, status, category, platform, locale.
- **Never** label by `user_id`, `post_id`, or other unbounded dimensions; those go in traces, not metrics.

---

## 6.2.3 Traces

### Distributed tracing

Every cross-component request (mobile → Edge Function → Postgres) carries an OpenTelemetry-compatible trace context:

- `traceparent` header on HTTP.
- Trace ID propagated into Postgres via `set_config('app.trace_id', ...)`.
- Realtime events tag the originating trace ID in their payload.

### Sampled at 10%

In production, **10%** of traces are kept end-to-end; **100%** of failed traces are kept regardless.

### Spans of interest

- HTTP / RPC entry.
- DB queries (with statement fingerprint, no parameter values).
- Storage uploads.
- Push fan-out per recipient device.

---

## 6.2.4 Dashboards

The on-call engineer has these dashboards available:

1. **Service Overview.** Per-endpoint RED, Postgres health, Realtime health.
2. **North Star.** `posts_closed_delivered_total`, weekly trend, conversion ratio.
3. **Funnel Health.** Sign-up → onboarding → first-post completion rate, day-by-day.
4. **Notification Pipeline.** Trigger → fan-out → delivery latency, success rate per provider.
5. **Moderation.** Reports per day, auto-removals, sanctions, false-report sanctions.

Dashboards are version-controlled as code (`CODE_QUALITY.md` describes the tooling).

---

## 6.2.5 Alerts

| Alert | Trigger | Severity | Routing |
| ----- | ------- | -------- | ------- |
| Service availability < `NFR-AVAIL-001` | uptime probe failure ≥ 3 of last 5 minutes | High | PagerDuty primary on-call |
| API 5xx rate > `NFR-RELI-001` | rolling 5-min rate >0.5% | High | PagerDuty |
| Push delivery success < `NFR-PERF-009` | rolling 1-h success rate <98% | Medium | Slack + PagerDuty |
| Drift detected | `stats_drift_detected` >0 in last hour | Medium | Slack |
| Background job failure | retries exhausted | Medium | Slack |
| Open report unresolved >30d | `Report.status='open' AND created_at<now()-30d` | Low | Slack to ops |
| Auth failure spike | sign-in failures +500% over 24h baseline | High | PagerDuty (security) |
| Edge Function cold start regression | p95 cold start > 1.5s for 30 min | Low | Slack |

Each alert has a documented runbook in `CODE_QUALITY.md`.

---

## 6.2.6 SLOs and error budgets

The MVP commits to the following SLOs (Service Level Objectives):

- **Service availability:** 99.5% (`NFR-AVAIL-001`).
- **Feed first-page latency:** p95 ≤ 500 ms server (`NFR-PERF-002`).
- **Realtime freshness:** p95 ≤ 2 s (`NFR-PERF-005`).
- **API error rate:** <0.5% (`NFR-RELI-001`).

Each SLO has a 28-day rolling error budget; budget consumption above 50% within 7 days triggers a code-freeze on non-critical changes until the budget recovers.

---

## 6.2.7 Privacy in observability

- All redaction rules from `NFR-SEC-013` and `NFR-PRIV-012` apply to logs, metrics labels, and trace attributes.
- Sentry / Crashlytics breadcrumbs are reviewed quarterly for accidental PII leakage.
- The observability platform is a sub-processor; covered by the Privacy Policy.

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial draft. |
