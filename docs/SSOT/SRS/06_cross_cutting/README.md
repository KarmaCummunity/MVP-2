# Part VI — Cross-Cutting Concerns

[← back to SRS index](../../SRS.md) · [← back to Part V](../05_external_interfaces.md)

---

This part captures concerns that span every functional domain:

- Analytics events that instrument the KPIs.
- Observability (logs, metrics, traces).
- Internationalization & RTL handling.
- Feature flags for gradual rollout.
- Background jobs (the cron-driven side of the system).
- Audit trail (security and accountability).

| File | Topic |
| ---- | ----- |
| [`01_analytics_and_events.md`](./01_analytics_and_events.md) | Event taxonomy, KPI instrumentation, ingest schema. |
| [`02_observability.md`](./02_observability.md) | Logs, metrics, traces, dashboards, alerts. |
| [`03_i18n_rtl.md`](./03_i18n_rtl.md) | Locale strategy, RTL implementation rules, content management. |
| [`04_feature_flags.md`](./04_feature_flags.md) | Flag conventions, rollout patterns, kill switches. |
| [`05_background_jobs.md`](./05_background_jobs.md) | Scheduled jobs catalog: `bg-job-*` IDs and contracts. |
| [`06_audit_trail.md`](./06_audit_trail.md) | Audit event taxonomy, retention, access. |

---

*Next: [`01_analytics_and_events.md`](./01_analytics_and_events.md)*
