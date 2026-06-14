# Nonprofit OS — Back-Office Depth & Multi-Tenant Portal — Design Spec

> **Status:** Draft, 2026-06-14
> **Owner:** Product (Naves) + agents
> **Mapped to spec:** extends `docs/SSOT/spec/12_super_admin.md` (FR-ADMIN-*); introduces `docs/SSOT/spec/17_back_office.md` (FR-BO-*) and `docs/SSOT/spec/18_organizations.md` (FR-ORG-*)
> **Decisions:** `D-60` (tenancy model), `D-61` (SaaS billing), `D-62` (Nonprofit-OS dual-track scope)
> **Decomposition:** two parallel tracks (Back-Office Depth · Multi-Tenancy Platform), each a sequence of PR-sized slices.

---

## 1. Vision

Run the **entire** non-profit from the in-app admin portal with **no external tools** — finances (income/expenses), donors, suppliers, employees, payroll, reporting, compliance — and then **sell that same portal to other NGOs as a SaaS**, each seeing only their own data behind their own branding.

Two outcomes, one codebase:

1. **Nonprofit OS (depth).** Turn today's thin admin modules (`/money`, `/crm`, `/time`, `/org-approvals`) into a real back-office: budgets, P&L, tax receipts, accounts-payable, HR + payroll, donor management.
2. **Multi-tenant platform (breadth).** Every org is a tenant; data is isolated by `org_id` + RLS; orgs onboard via self-serve provisioning; each gets white-label branding and a paid subscription.

PM decisions locked on 2026-06-14:
- **Tenancy model:** shared database + RLS keyed on `org_id`, tenant resolved from a JWT claim (`D-60`).
- **Commercial model:** paid SaaS subscription per org (`D-61`).
- **Sequencing:** both tracks run **in parallel** (`D-62`).
- **v1 back-office scope:** Donors+Donations, deeper Finance, Suppliers+AP, Employees+Payroll (HR).

---

## 2. Current state (2026-06-14)

The admin portal is far more mature than a moderation console. Reconnaissance found a full clean-architecture stack already shipped:

**Shipped & specced** (`FR-ADMIN-001..020`, `12_super_admin.md`): RBAC (`admin_role_grants`), reports inbox, internal tasks, admins roster, user/post search, audit viewer. RBAC already models **org-scoped roles** (`org_admin`, `org_manager`, `org_employee`, `volunteer_manager`, `org_volunteer`, `operator`, `operators_manager`) with `admin_role_grants.scope_org_id` and a full `can_grant_role()` authority matrix.

**Shipped but NOT specced** (doc drift — see §9): four back-office modules exist end-to-end (domain entity → use case → port → Supabase adapter → screen → RLS → RPCs) yet have no FR-IDs in `12_super_admin.md`:
- `/admin/money` — `finance_ledger_entries` (donation_in / grant_in / expense / refund_out / transfer; `amount_cents`; summary by currency; soft-delete).
- `/admin/crm` — `crm_contacts` (donor/partner/journalist; tags; cold→warm→active→inactive).
- `/admin/time` — `timesheet_entries` (`hours_x100`; draft→submit→approve/reject).
- `/admin/org-approvals` — `org_applications` (apply/approve/reject) — **approval has no side-effect; there is no `organizations` table yet.**

**The missing root:** `scope_org_id` exists as a bare `uuid` with **no FK and no `organizations` table**. Every domain row (users, posts, donations, chats, rides, finance, …) is implicitly single-tenant. The seeds for multi-tenancy are planted; the root is not.

---

## 3. Target architecture

### 3.1 Layering (CLAUDE.md §5 — unchanged)

```
packages/domain/{org,finance,hr,crm,billing}/   entities + invariants (pure)
packages/application/{org,finance,hr,...}/       use cases + ports (I*.ts)
packages/infrastructure-supabase/{...}/          adapters (RPC + table reads)
apps/mobile/src/app/(admin)/...                  Expo Router screens (composition root)
packages/ui/                                     tokens + white-label theming primitives
```

All writes go through `SECURITY DEFINER` RPCs that re-assert role **and** tenant. Client gating stays convenience-only.

### 3.2 Tenancy model (`D-60`)

Shared Postgres, one project per environment (dev `roeefqpdbftlndzsvhfj`, prod `slxijdfvinbjmrsfgbzx`). Isolation by `org_id` + RLS.

**Tenant context.** The active `org_id` rides in the JWT as a custom claim, set by a Supabase **Auth Hook** (`custom_access_token_hook`) from the user's org membership. RLS reads it via a stable helper:

```sql
create or replace function public.current_org_id() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'org_id', '')::uuid
$$;
```

**Membership.** A user may belong to >1 org (staff who help multiple NGOs, or platform staff). `org_memberships(user_id, org_id, default)` drives an **org switcher** in the portal; switching re-issues the token (or sets a request-scoped GUC) so `current_org_id()` changes. Platform super-admins bypass tenant scoping via `has_admin_role(auth.uid(),'super_admin')` inside every policy.

**RLS pattern (every tenant table):**

```sql
alter table public.<t> enable row level security;
create policy <t>_tenant_isolation on public.<t>
  for all using (
    org_id = public.current_org_id()
    or public.has_admin_role(auth.uid(), 'super_admin')
  ) with check (
    org_id = public.current_org_id()
    or public.has_admin_role(auth.uid(), 'super_admin')
  );
```

`org_id` is **server-set** (DEFAULT `current_org_id()` + RPC enforcement), never trusted from the client. A CI guard (extend `lint:arch`) fails any new tenant table that ships without `org_id NOT NULL` + an isolation policy.

### 3.3 Why shared-DB-RLS (rejected alternatives)

- **DB/project per tenant** — strongest isolation but multiplies migrations, ops, cost, and provisioning latency; incompatible with the single-codebase autonomous loop. Reconsider only for an enterprise tier (escape hatch noted in `D-60`).
- **Schema per tenant** — Postgres connection/search-path gymnastics, painful migrations at scale.
- Shared-DB-RLS matches the existing Supabase architecture, keeps one migration timeline, and Supabase's RLS is the intended isolation primitive. The accepted risk — an RLS bug leaks cross-tenant data — is mitigated by §7.

---

## 4. Data model

### 4.1 New core tables (Track B foundation)

| Table | Purpose | Key columns |
|---|---|---|
| `organizations` | tenant root | `id`, `slug` (unique), `legal_name`, `display_name`, `registry_number` (ע"ר/ח"פ), `status` (active/suspended/trial), `plan_id`, `created_at` |
| `org_memberships` | user↔org with default | `user_id`, `org_id`, `is_default`, `created_at`; unique `(user_id, org_id)` |
| `org_branding` | white-label | `org_id`, `logo_url`, `primary_color`, `accent_color`, `custom_domain`, `email_from_name` |
| `org_settings` | per-tenant config | `org_id`, `currency`, `locale`, `fiscal_year_start_month`, feature flags `jsonb` |

`admin_role_grants.scope_org_id` gains its FK → `organizations(id)`. `org_applications` approval becomes transactional: create `organizations` row + founder `org_memberships` + `org_admin` grant + seed `org_settings`/`org_branding` defaults (`FR-ORG-*`).

### 4.2 `org_id` rollout to existing tables

Every business table gets a nullable `org_id uuid references organizations(id)`, backfilled to the **single default org** (the operator's own NGO), then set `NOT NULL` + isolation policy in a follow-up migration (two-step to stay backward-compatible per the `main` release guard). Order of attack: back-office tables first (new, low row-count), then community tables (users/posts/chats/rides — high volume, careful backfill).

### 4.3 Back-office depth tables (Track A)

| Module | Tables (new) | Notes |
|---|---|---|
| **Finance deepening** | `finance_accounts` (chart of accounts), `finance_budgets` + `finance_budget_lines`, `finance_fiscal_periods`; extend `finance_ledger_entries` with `account_id`, `budget_line_id`, `org_id` | P&L + cash-flow are **views/RPCs** over the ledger, not new tables |
| **Tax receipts** | `donation_receipts` (sequential number per org+year, donor, amount, §46A clause, PDF ref, void/reissue) | Israeli §46A / תיקון 13; numbering gapless per org |
| **Donors + donations** | `donors` (links to `crm_contacts`), `donations` (internal record: amount, method, recurring_id, receipt_id), `recurring_donations` | distinct from external `donation_links`; ties CRM → ledger → receipt |
| **Suppliers + AP** | `suppliers`, `purchase_orders`, `supplier_invoices`, `supplier_payments` | invoice→payment lifecycle posts to ledger |
| **HR + payroll** | `employees` (contract, role, salary), `employment_contracts`, `payroll_runs` + `payslips`, `leave_requests`; `timesheet_entries` gains `employee_id`, `org_id` | payroll posts expenses to ledger |

All amounts in **minor units** (`*_cents bigint`) per the existing ledger convention. All gated by tenant isolation RLS from day one.

### 4.4 Billing / SaaS (`D-61`)

| Table | Purpose |
|---|---|
| `plans` | tiers (features, limits, price) |
| `subscriptions` | `org_id`, `plan_id`, `status` (trialing/active/past_due/canceled), `current_period_end`, `provider_ref` |
| `invoices` (platform) | what the platform charges each org — **separate** from `supplier_invoices` (what an org pays its vendors) |

Payment provider TBD (PM action — Stripe vs Israeli PSP for ILS/VAT). Provider integration is an Edge Function + webhook; `subscriptions.status` gates `organizations.status` → drives a soft "subscription expired" lock in `AdminGate`.

---

## 5. Product surface

### 5.1 Portal IA (target)

```
(admin)/
  index            dashboard — org-scoped KPIs (cash position, donations MTD, open POs, headcount)
  finance/         ledger · accounts · budgets · reports(P&L, cash-flow) · receipts
  donors/          donor list · donation history · recurring · receipts
  suppliers/       suppliers · purchase-orders · invoices · payments
  hr/              employees · contracts · timesheets · payroll · leave
  crm/             (existing) broadened
  reports/ tasks/ admins/ users/ posts/ audit/   (existing platform-ops)
  org/             settings · branding · members · billing   (org-admin self-serve)
  (platform)/orgs  super-admin: tenant list, suspend, impersonate, plan mgmt
```

Navigation is **permission-filtered** (existing `AdminGate` + `AdminPermission` matrix). Org-admins see their org's back-office; platform staff additionally see `(platform)`.

### 5.2 White-label

`org_branding` feeds a `ThemeProvider` over `@kc/ui` tokens (logo, primary/accent). Custom domain maps to the same web bundle; the host resolves `org_id` by slug/domain before auth. MVP: subdomain per org (`<slug>.karma-community-kc.com`); custom domains later.

### 5.3 Reporting & compliance

Financial reports (P&L, cash-flow, donation summary, budget-vs-actual) as RPC-backed read models + CSV/PDF export. Compliance hooks: gapless §46A receipt numbering, ניהול-תקין annual-report data extract, ILITA registration threshold alert (existing `TD-54`).

---

## 6. Roadmap — two parallel tracks (`D-62`)

Each slice is one PR set to `dev`, with domain/app unit tests, RLS probes, and SSOT updates. Track A delivers value to our own NGO immediately (single default org); Track B makes it sellable. They converge: Track A tables are born with `org_id`, so Track B's isolation flips them on with no rewrite.

### Track B — Multi-Tenancy Platform (`FR-ORG-*`, spec 18)

- **B0 — Tenant root.** `organizations`, `org_memberships`, `org_settings`, `org_branding`; FK from `admin_role_grants.scope_org_id`; backfill single default org; `current_org_id()` + Auth Hook. *No isolation enforced yet — additive only.*
- **B1 — Provisioning.** `org_applications` approve → transactional org creation + founder grant + seeds. Org switcher in portal.
- **B2 — Isolation rollout.** Add `org_id` + isolation RLS across back-office tables (low-risk first), then community tables in a guarded, batched backfill. CI guard for new tenant tables.
- **B3 — White-label.** `org_branding` ThemeProvider; subdomain routing; per-org logo/colors.
- **B4 — SaaS billing.** `plans`/`subscriptions`/`invoices`; provider webhook Edge Function; subscription-state lock in `AdminGate`.
- **B5 — Platform console.** Super-admin `(platform)/orgs`: tenant list, suspend, impersonate (audited), plan management.

### Track A — Back-Office Depth (`FR-BO-*`, spec 17)

- **A0 — Spec catch-up.** Backfill FR-IDs for the already-shipped `/money`, `/crm`, `/time`, `/org-approvals` into `17_back_office.md`; close the doc-drift debt. *(Docs-only; no behavior change.)*
- **A1 — Finance core.** Chart of accounts, fiscal periods, ledger gains `account_id`; P&L + cash-flow report RPCs + export.
- **A2 — Budgets.** `finance_budgets` + lines; budget-vs-actual report; dashboard cash-position card.
- **A3 — Donors & donations.** `donors`/`donations`/`recurring_donations`; CRM linkage; donation history.
- **A4 — Tax receipts.** Gapless §46A receipt numbering per org+year; PDF generation; void/reissue.
- **A5 — Suppliers & AP.** `suppliers`/`purchase_orders`/`supplier_invoices`/`supplier_payments`; invoice→payment→ledger posting.
- **A6 — HR & payroll.** `employees`/contracts; `timesheet_entries.employee_id`; `payroll_runs`/`payslips`; leave; payroll→ledger posting.

**Suggested cadence:** interleave so the BE lane (`supabase/**`, `infrastructure-supabase/**`) drives B0→B2 while the FE lane (`apps/mobile/**`, `ui/**`) drives A0→A3, syncing on contract changes per CLAUDE.md §9.

---

## 7. Security & isolation (the make-or-break)

Shared-DB-RLS lives or dies on isolation correctness:

1. **Default-deny.** Every tenant table: RLS on, isolation policy, writes via RPC only. No table ships without it (CI guard).
2. **Server-set `org_id`.** DEFAULT `current_org_id()`; RPCs ignore any client-supplied `org_id`. Never trust the client.
3. **Cross-tenant test matrix.** For each module, an integration test proves org-A cannot read/write org-B rows (extend the existing `sqlProbes` / RLS CI job).
4. **Audit every privileged action**, especially super-admin **impersonation** of a tenant (who, which org, when, why) into `audit_events` with `org_id`.
5. **PII & GDPR per tenant.** Export and delete operate within one org; receipts/financial records honor legal retention (don't hard-delete what law requires keeping).
6. **Least privilege for platform staff.** Platform roles bypass isolation only through explicit `has_admin_role(...,'super_admin')` in policy — not a blanket `service_role` path from the client.

---

## 8. Risks & open questions

| Risk / question | Owner | Note |
|---|---|---|
| RLS bug leaks cross-tenant data | BE | Mitigated by §7; highest-severity class — every PR needs a cross-tenant probe |
| Backfilling `org_id` onto high-volume community tables | BE | Two-step nullable→NOT NULL; batched; backward-compatible per `main` guard |
| Payment provider for ILS + VAT invoicing | **PM** | Stripe vs Israeli PSP — gates B4 (`TD` to be filed) |
| Payroll legal accuracy (Israeli tax/ביטוח לאומי) | **PM** | v1 may record payroll, not *compute* statutory deductions — confirm scope |
| §46A receipt legal validity (digital signature, registry approval) | **PM** | Confirm the org holds §46A status + e-receipt acceptance |
| Custom domains + TLS at scale | BE | Subdomain-first; custom domains deferred |
| Existing `(admin)` modules predate FR-IDs | Docs | A0 closes the drift before extending |

---

## 9. Doc drift to close (A0)

`/admin/money`, `/admin/crm`, `/admin/time`, `/admin/org-approvals` and their tables/RPCs/entities shipped without FR-IDs in `12_super_admin.md`. A0 backfills them into `17_back_office.md` (retro-spec, status ✅ for what already works) so future slices extend a real spec, not undocumented code. Logged as a TECH_DEBT item.

---

## 10. SSOT changes shipped with this design

- `DECISIONS.md` — `D-60` (tenancy), `D-61` (billing), `D-62` (dual-track scope).
- `spec/17_back_office.md` — new domain skeleton, `FR-BO-*` (finance, donors, suppliers/AP, HR/payroll), status ⏳ except retro-specced existing modules.
- `spec/18_organizations.md` — new domain skeleton, `FR-ORG-*` (tenancy, provisioning, white-label, billing), status ⏳.
- `BACKLOG.md` — Track A / Track B epics under a new **P3 — Nonprofit OS** section.
- `TECH_DEBT.md` — doc-drift item for unspecced back-office modules.
- `CLAUDE.md` — spec index updated with domains 17 + 18.
