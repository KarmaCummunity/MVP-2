# 18 — Organizations & Multi-Tenancy (FR-ORG-*)

**Status:** ⏳ Planned (Track B of Nonprofit OS)
**Owner:** Autonomous loop
**Design doc:** `docs/superpowers/specs/2026-06-14-nonprofit-os-back-office-and-multitenancy-design.md`
**Decisions:** `D-60` (shared-DB + RLS tenancy), `D-61` (paid SaaS), `D-62` (dual-track scope)

This domain makes every organization a tenant. Isolation is shared-database + RLS keyed on `org_id`, with the active tenant carried in a JWT claim (`D-60`). Other NGOs onboard as paid SaaS subscribers (`D-61`). The org-scoped RBAC (`admin_role_grants.scope_org_id`, `can_grant_role()`) already shipped in domain 12; this domain supplies the missing root and isolation.

---

## B0 — Tenant root (additive, no isolation enforced yet)

### FR-ORG-001 — Organizations table ⏳
`organizations` (`id`, `slug` unique, `legal_name`, `display_name`, `registry_number`, `status` active/suspended/trial, `plan_id`). `admin_role_grants.scope_org_id` gains its FK to it. Backfill a single **default org** for existing data.

### FR-ORG-002 — Memberships & default org ⏳
`org_memberships(user_id, org_id, is_default)` (a user may belong to >1 org). Drives the portal org switcher.

### FR-ORG-003 — Per-org settings & branding tables ⏳
`org_settings` (currency, locale, fiscal-year start, feature flags) + `org_branding` (logo, colors, custom domain, email-from). Seeded with defaults.

### FR-ORG-004 — Tenant context helper & Auth Hook ⏳
`public.current_org_id()` reads `app_metadata.org_id` from the JWT; a `custom_access_token_hook` sets it from the user's default/active membership. Switching org re-issues the token.

---

## B1 — Provisioning

### FR-ORG-010 — Transactional org creation on approval ⏳
`org_applications` approval (domain 12) becomes transactional: create `organizations` + founder `org_memberships` + `org_admin` grant + seed `org_settings`/`org_branding`. Replaces today's no-op approval.

### FR-ORG-011 — Org switcher ⏳
Portal control to switch active org for multi-org users; super-admins can target any org.

---

## B2 — Isolation rollout

### FR-ORG-020 — `org_id` + isolation RLS on tenant tables ⏳
Add `org_id` (nullable→backfill→`NOT NULL`) and a tenant-isolation policy to every business table — back-office tables first (low row-count), then high-volume community tables (users/posts/chats/rides) in a guarded, batched backfill. Two-step to stay backward-compatible (`D-53`).

### FR-ORG-021 — Tenant-table CI guard ⏳
`lint:arch` (or a backend CI job) fails any new tenant table lacking `org_id NOT NULL` + an isolation policy. Per-module cross-tenant probe in the RLS CI job (org-A cannot read/write org-B).

---

## B3 — White-label

### FR-ORG-030 — Per-org theming ⏳
`org_branding` feeds a `ThemeProvider` over `@kc/ui` tokens (logo, primary/accent color).

### FR-ORG-031 — Subdomain routing ⏳
Resolve `org_id` from `<slug>.karma-community-kc.com` before auth. Custom domains + TLS deferred.

---

## B4 — SaaS billing (`D-61`)

### FR-ORG-040 — Plans & subscriptions ⏳
`plans` (features, limits, price) + `subscriptions` (`org_id`, `plan_id`, status, `current_period_end`, `provider_ref`). `subscriptions.status` gates `organizations.status`.

### FR-ORG-041 — Subscription gating ⏳
Soft "subscription expired / past_due" lock in `AdminGate` (read-only or blocked) driven by subscription state.

### FR-ORG-042 — Payment provider integration ⏳
Edge Function + webhook to the chosen provider; platform `invoices` (distinct from `supplier_invoices`). **Provider choice is a PM dependency** (Stripe vs Israeli PSP for ILS + VAT).

---

## B5 — Platform console (super-admin)

### FR-ORG-050 — Tenant management ⏳
`(admin)/(platform)/orgs`: list tenants, view status/plan, suspend/reactivate, manage plans.

### FR-ORG-051 — Audited impersonation ⏳
Super-admin can enter a tenant's portal for support; every impersonation is audit-logged (who, org, when, why) into `audit_events` with `org_id`.
