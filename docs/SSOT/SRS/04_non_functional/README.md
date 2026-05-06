# Part IV — Non-Functional Requirements

[← back to SRS index](../../SRS.md) · [← back to Part III](../03_domain_model.md)

---

This part specifies **how well** the system must perform — the quality attributes that define a usable, safe, scalable, accessible product. NFRs differ from FRs in two ways:

1. They are **measurable** with a number, not a binary pass/fail.
2. They cut across multiple FRs simultaneously.

Each NFR has a `Statement` (the target), a `Measurement` (how we verify), and a `Source` (where it originates).

## Domains

| File | Prefixes | Scope |
| ---- | -------- | ----- |
| [`01_performance_scalability_availability.md`](./01_performance_scalability_availability.md) | `NFR-PERF-*`, `NFR-SCALE-*`, `NFR-AVAIL-*` | Latency budgets, throughput, capacity, uptime SLO. |
| [`02_security_and_privacy.md`](./02_security_and_privacy.md) | `NFR-SEC-*`, `NFR-PRIV-*` | Authentication, authorization, encryption, PII handling, GDPR / Israeli Privacy Law. |
| [`03_accessibility_i18n.md`](./03_accessibility_i18n.md) | `NFR-A11Y-*`, `NFR-I18N-*` | WCAG baseline, RTL parity, locale strategy. |
| [`04_reliability_platform.md`](./04_reliability_platform.md) | `NFR-RELI-*`, `NFR-PLAT-*` | Error rates, retry semantics, offline tolerance, cross-platform parity. |
| [`05_maintainability.md`](./05_maintainability.md) | `NFR-MAINT-*` | File-size caps, complexity caps, test coverage, dependency hygiene. |

## Reading conventions

Each NFR follows this template (see [`../00_meta.md`](../00_meta.md) §0.4):

```
### NFR-{TOPIC}-{NNN} — {Title}

**Statement.** {single measurable target}
**Measurement.** {how it is verified}
**Source.** {where it originates}
**Applies to.** {platforms / surfaces}
```

NFRs that are not yet measured at MVP launch carry `Measurement: deferred to V1.5` and a corresponding `Q-*` in [`appendices/D_open_questions.md`](../appendices/D_open_questions.md).

---

*Next: [`01_performance_scalability_availability.md`](./01_performance_scalability_availability.md)*
