# Nonprofit OS — Deep Implementation Plan (resume-ready)

> **Companion to** the design spec `docs/superpowers/specs/2026-06-14-nonprofit-os-back-office-and-multitenancy-design.md`.
> The design doc says *what* and *why*; this plan says *exactly how, in what order, with which files and tests*, and is written so a fresh session can **open it and continue without re-discovery**.
>
> **Specs:** `docs/SSOT/spec/17_back_office.md` (FR-BO-*), `docs/SSOT/spec/18_organizations.md` (FR-ORG-*).
> **Decisions:** `D-60` (shared-DB + RLS tenancy), `D-61` (Stripe SaaS behind `IPaymentProvider`), `D-62` (dual-track).
> **Branch:** `claude/admin-dashboard-planning-1g2xy5` → PR #555 → base `dev`.

---

## 0. Status snapshot (2026-06-14)

| Slice | Scope | State |
|---|---|---|
| Planning | design doc, D-60/61/62, specs 17+18, BACKLOG P3, TD-171 | ✅ merged into branch |
| **B0** | tenant root: `organizations` / `org_memberships` / `org_settings` / `org_branding`; `scope_org_id` FK; default-org backfill; `current_org_id()`; `get_my_organizations()` + data layer | ✅ shipped (migration **0202**) |
| **B1** | provisioning: `admin_org_application_decide` approve → transactional org create + founder `org_admin` grant + `generate_org_slug()` | ✅ backend (migration **0203**) |
| **A0** | retro-spec `/money` `/crm` `/time` as FR-BO-001/010/020; close TD-171 | ✅ docs |
| **A1·FR-BO-100** | chart of accounts: `finance_accounts` + ledger `account_id` + seed + list/upsert RPCs + data layer | ✅ shipped (migration **0204**) |

**Current migration head on this branch:** `0204` (dev's head was `0201`; next free number is **0205**).
**Verified green on the merged tree:** `pnpm typecheck` · `pnpm test` · `pnpm lint` (incl. `lint:arch`) · `check-migration-chain` (203 files) · `check-migration-safety`.

### What is NOT done yet (the rest of this plan)
- **Track B:** B2 (org_id isolation across existing tables — the make-or-break), B3 (white-label), B4 (billing), B5 (platform console); plus **org switcher UI** (FR-ORG-011) and the **Auth Hook** ops step (FR-ORG-004).
- **Track A:** FR-BO-101 (fiscal periods), FR-BO-102 (reports), A2 budgets, A3 donors/donations, A4 §46A receipts, A5 suppliers/AP, A6 HR/payroll; plus **FE screens** for finance accounts.

---

## 1. How to resume (do this first, in order)

1. `git fetch origin dev && git switch claude/admin-dashboard-planning-1g2xy5 && git merge origin/dev` — dev moves fast; reconcile **before** writing code. **Watch for migration-number collisions**: dev may have taken `0205+`. If so, renumber your new files to sit after dev's head and fix references (see §2.6).
2. From `app/`: `pnpm install` then `pnpm typecheck && pnpm test && pnpm lint` — confirm a green baseline before touching anything.
3. Pick the next slice from §3/§4. Default order (highest leverage first): **B2 isolation** ➝ then interleave A-track depth. Rationale: every new Track-A table is already born with `org_id`, but the *existing* community tables are still single-tenant; until B2, the product cannot be sold to a second NGO without data leaking. B2 is the gate to "multi-tenant".
4. Flip the BACKLOG row `⏳/🟡` and follow CLAUDE.md §1–§6.
5. Local migration validation is mandatory before push — see §2.7.

**Ops items that block runtime but not merge** (track in BACKLOG, do not silently skip):
- **Auth Hook (FR-ORG-004):** enable `custom_access_token_hook` in Supabase dev Auth so `app_metadata.org_id` is populated; until then `current_org_id()` returns NULL and isolation policies (B2) would deny everything for non-super-admins. **B2 cannot be enforced in prod until this hook is live.** See §3.1.

---

## 2. Cross-cutting conventions (apply to every slice)

### 2.1 The tenant-table contract (Track A + B2)
Every business table MUST:
1. have `org_id uuid not null references organizations(id)` (new tables: `default current_org_id()`);
2. have RLS enabled with the isolation policy (§2.2);
3. accept writes only through `SECURITY DEFINER` RPCs that **ignore any client `org_id`** and set it from `current_org_id()` / `finance_resolve_org_id()`;
4. ship a cross-tenant probe test (§2.5).

### 2.2 RLS isolation template
```sql
alter table public.<t> enable row level security;
create policy <t>_tenant_isolation on public.<t> for all
  using      ( org_id = public.current_org_id()
               or public.has_admin_role(auth.uid(), 'super_admin') )
  with check ( org_id = public.current_org_id()
               or public.has_admin_role(auth.uid(), 'super_admin') );
```
For back-office tables that are *also* role-gated (finance/HR), AND the `money.manage`/`hr.manage` check inside the RPC — RLS does tenant isolation, the RPC does role.

### 2.3 Helpers already in place (reuse, don't re-create)
- `public.current_org_id()` → uuid (migration 0202) — reads `app_metadata.org_id` from the JWT.
- `public.finance_resolve_org_id()` → uuid (migration 0204) — `coalesce(current_org_id(), default-org)`; the safe pre-Auth-Hook fallback. **Generalize this to `public.resolve_org_id()`** in B2 and reuse everywhere (currently finance-named; rename in the B2 migration and update the one caller).
- `public.has_admin_role(uid, role)` / `public.admin_assert_role(uid, text[])` — role gate inside RPCs.
- `generate_org_slug(text)` (0203) — safe unique slug.

### 2.4 Layering & code conventions (CLAUDE.md §5)
- `packages/domain/<area>/` pure entities + `*Error` classes + parsers; `readonly` fields; zero I/O. Tests beside in `__tests__/`.
- `packages/application/<area>/` use cases (one per file) + `I*.ts` ports. No Supabase/React.
- `packages/infrastructure-supabase/<area>/` adapters calling RPCs; map PG error codes → domain `*Error`.
- `apps/mobile/...` screens; wire use cases in `apps/mobile/src/lib/container.ts`.
- **Barrels:** export new use cases via the area `index.ts` barrel (e.g. `application/src/admin/index.ts`, `.../org/index.ts`) — keeps `application/src/index.ts` under the 300-line cap. Add new areas (`finance/`, `hr/`, `billing/`) as their own barrel + a single `export * from './<area>'` line in the root index.
- **Caps:** ≤300 lines/file (`lint:arch`), ≤3 indent levels, domain `*Error` not raw `Error`. Money in `*_cents bigint` minor units.

### 2.5 Test requirements per slice
- Domain: parser + error-guard unit tests (happy + boundary).
- Application: use-case tests with a mocked port (validation, forwarding, error mapping).
- Infra: adapter unit tests with a mocked Supabase client (param mapping + PG-error→domain-error).
- **SQL probe** (`supabase/tests/<NNNN>_*.sql`): for any RLS/RPC slice, assert (a) role gate denies the unprivileged, (b) **cross-tenant**: org-A session cannot read/write org-B rows.

### 2.6 Migration numbering
Files are `supabase/migrations/<NNNN>_<slug>.sql`, strictly sequential & unique. Before creating one, run `node scripts/check-migration-chain.mjs` to see the head. On a dev collision, `git mv` to the next free number and fix: (a) the header comment's self-reference, (b) SSOT doc refs (`grep -rn` the old number under `docs/`), (c) cross-migration mentions. Never renumber a migration already merged to `dev`.

### 2.7 Local migration validation (mandatory pre-push)
CI on draft PRs is **skipped**, and the official migration-apply job only runs on a fresh stack. Validate locally against real PostgreSQL 16:
```
initdb a temp cluster → create stub tables/functions for deps not in your migration
  → apply your migration(s) with ON_ERROR_STOP=1 → run functional asserts
  (seed counts, RPC happy path, constraint violations) → drop the cluster.
```
This caught the 0202/0203/0204 work end-to-end. Keep doing it; never rely on draft CI.

### 2.8 Destructive SQL
The `main` release guard fails on `DROP TABLE/COLUMN`, `TRUNCATE`, unqualified `DELETE` unless the line has `migration-safety: allow` + PR justification. The two-step `org_id` rollout (§3.2) is designed to avoid destructive SQL entirely.

---

## 3. Track B — Multi-Tenancy Platform (FR-ORG-*)

### B2 — org_id isolation rollout  ★ next, highest leverage ★
**Goal:** make every existing table tenant-scoped so a second NGO sees only its own data. This is what turns "single-org app" into "multi-tenant SaaS".

**Strategy — two-step per table, backward-compatible (no destructive SQL):**
- **Step 1 (additive):** `alter table <t> add column org_id uuid references organizations(id);` then backfill to the default org (`select id from organizations where slug='karma-community'`). Set a `DEFAULT resolve_org_id()` so new rows self-tag. Leave nullable. Ship + deploy. *No isolation yet — nothing breaks.*
- **Step 2 (enforce):** once backfill is verified 100% non-null, `set not null` + add the §2.2 isolation policy + route writes through org-aware RPCs. Ship as a **separate** migration after Step 1 is live.

**Order of attack (low-risk first):**
1. Back-office tables (new, low volume, already partly born with org_id): `finance_ledger_entries`, `finance_accounts` (already has org_id), `crm_contacts`, `timesheet_entries`, `org_applications`.
2. Community tables (high volume — batch the backfill, verify counts): `users`, `posts`, `chats`, `messages`, `donation_links`, `rides`, `reports`, `notifications`, `audit_events`, stats tables.

**Pre-req:** the Auth Hook (§3.1) MUST be live in each environment **before** Step 2 of any table, or non-super-admin reads return empty. Sequence: enable hook in dev → B2 step-2 on back-office → verify → community tables → enable hook in prod as part of that release.

**CI guard:** extend `app/scripts/check-architecture.mjs` (or a new `scripts/check-tenant-tables.mjs` run in `lint:arch`) to fail any **new** migration that creates a table with no `org_id` + no isolation policy. Maintain an allowlist of intentionally-global tables (`organizations`, `plans`, `schema_migrations`, lookup tables like `cities`).

**Generalize the helper:** rename `finance_resolve_org_id()` → `resolve_org_id()` (keep a thin `finance_resolve_org_id` wrapper or update the single caller in 0204) so all areas share one tenant-resolution function.

**Tests:** per table, a `supabase/tests/<NNNN>_<t>_tenant_isolation.sql` proving org-A ≠ org-B and super-admin bypass. This is the highest-severity test class in the whole project (an RLS hole = cross-tenant data leak).

**Risks:** backfilling high-volume tables; an RLS bug leaking data. Mitigate with batched backfill + the cross-tenant probe on every table + a staged rollout (back-office before community).

**Est:** large — split into one PR per table-group (B2a back-office, B2b users/posts, B2c chat/messages, B2d rides/donations, B2e reports/notifications/audit/stats).

### B1-remainder — Org switcher UI (FR-ORG-011)
**Goal:** a user in >1 org picks the active org; switching changes `current_org_id()`.
- **FE:** a switcher in the admin portal header reading `container.getMyOrganizations()` (already wired). On select, call an RPC to set the default / re-issue the token, then invalidate React Query caches.
- **BE:** `set_default_org(org_id)` RPC updating `org_memberships.is_default` (enforce at-most-one default). Token re-issue: simplest is to flip `is_default` and have the Auth Hook read the default on next token refresh; for an immediate switch, set a request GUC or force a session refresh. **Product decision needed:** instant switch (GUC/refresh) vs next-login switch — default to **session refresh on switch** for correctness.
- **Tests:** RPC enforces single default; FE switcher state test.
- **Est:** medium.

### B3 — White-label
**Goal:** each org renders its own logo/colors; subdomain routing resolves the tenant pre-auth.
- **Data:** `org_branding` exists (0202). Add a public-safe read (`get_org_branding_by_slug(slug)` — branding is non-sensitive) so the host can theme before login.
- **UI:** a `ThemeProvider` over `@kc/ui` tokens fed by branding (primary/accent/logo). Default to KC tokens when absent.
- **Routing:** subdomain `<slug>.<host>` → resolve `org_id` by slug. MVP subdomain-only; custom domains + TLS deferred.
- **Tests:** theme falls back cleanly; slug resolution.
- **Est:** medium. **Depends on:** B2 (so branding reads are tenant-safe) + Auth Hook.

### B4 — SaaS billing (D-61, Stripe behind `IPaymentProvider`)
**Goal:** orgs subscribe; subscription state gates access.
- **Data:** `plans` (tier, features jsonb, limits, price_cents, currency), `subscriptions` (org_id, plan_id, status trialing/active/past_due/canceled, current_period_end, provider_ref), platform `invoices` (separate from `supplier_invoices`).
- **Port:** `IPaymentProvider` (application) — `createCheckout`, `cancel`, `webhookVerify`; **Stripe adapter** in infrastructure; Israeli PSP addable later without touching use cases.
- **Edge Function:** `billing-webhook` verifies Stripe signature → updates `subscriptions.status` → drives `organizations.status`.
- **Gate:** `AdminGate` shows a soft "subscription expired" lock when `subscriptions.status ∈ {past_due, canceled}`.
- **PM blockers (open):** VAT invoicing for ILS in Stripe; whether to use Stripe Billing vs Checkout+webhooks. File as TECH_DEBT until resolved.
- **Tests:** webhook state-machine; gate logic; provider port mock.
- **Est:** large. **Depends on:** B2.

### B5 — Platform console (super-admin)
**Goal:** `(platform)/orgs` for platform staff: tenant list, suspend/restore, **impersonate** (fully audited), plan management.
- **Data:** reuse `organizations`, `subscriptions`. Impersonation writes an `audit_events` row (who, which org, when, why) with `org_id`.
- **RPCs:** `platform_list_orgs`, `platform_set_org_status`, `platform_impersonate(org_id, reason)` (sets a scoped context; time-boxed; audited).
- **Gate:** entire route behind `has_admin_role(...,'super_admin')`.
- **Tests:** impersonation is audited; non-super-admin denied; suspend cascades to the gate.
- **Est:** medium-large. **Depends on:** B2, B4.

---

## 4. Track A — Back-Office Depth (FR-BO-*)

> Every Track-A table is born with `org_id default resolve_org_id()` + the §2.2 policy from day one, so B2 doesn't have to revisit them. All amounts `*_cents bigint`. All writes via `SECURITY DEFINER` RPCs role-gated by `money.manage` / `hr.manage` (add `hr.manage` to the permission matrix in A6).

### A1-remainder · FR-BO-101 — Fiscal periods & locking  ★ smallest next A step ★
- **Data:** `finance_fiscal_periods` (id, org_id, name, starts_on, ends_on, status open/closed, created_at). Add `fiscal_period_id` (nullable FK) to `finance_ledger_entries`.
- **Rule:** closing a period locks its entries from edit/delete; super_admin/org_admin can override with an audit-logged reason.
- **RPCs:** `finance_period_list`, `finance_period_create(name, starts_on, ends_on)`, `finance_period_close(id)`, `finance_period_reopen(id, reason)`. The existing `finance_ledger_upsert`/`delete` must reject writes to entries whose period is `closed` (unless override).
- **Layers:** domain `FiscalPeriod` + `FinancePeriodError`; application port + use cases; infra adapter; wire container; FE later.
- **Tests:** close → entry edit rejected; reopen audited; cross-tenant probe.
- **Est:** small-medium.

### A1-remainder · FR-BO-102 — Financial reports
- **Read models (no new storage):** `finance_report_pnl(from, to)` (income/expense/net grouped by account type → account), `finance_report_cashflow(from, to)` (in/out/net by month), `finance_report_donations(from, to)` (by donor/source). Build over `finance_ledger_entries` joined to `finance_accounts`.
- **Export:** CSV (client-side from rows) + PDF (defer PDF to a shared receipt/report PDF utility introduced in A4).
- **Layers:** domain report row types; application use cases; infra adapter; FE report screens with date-range pickers.
- **Tests:** aggregation correctness against seeded ledger; cross-tenant.
- **Est:** medium.

### A2 · FR-BO-110 — Budgets & budget-vs-actual
- **Data:** `finance_budgets` (org_id, fiscal_period_id, name) + `finance_budget_lines` (budget_id, account_id, amount_cents). Optional `budget_line_id` on ledger entries.
- **Report:** budget-vs-actual (planned vs ledger actuals per account). Dashboard cards: cash position + budget burn.
- **Est:** medium. **Depends on:** FR-BO-101 (periods) + FR-BO-100 (accounts).

### A3 · FR-BO-120/121 — Donors & donations
- **Data:** `donors` (links to `crm_contacts`), `donations` (amount_cents, method, donor_id, receipt_id, recurring_id, posts to ledger), `recurring_donations` (schedule). Distinct from external `donation_links` (domain 13).
- **Flow:** record donation → ledger `donation_in` entry → (A4) receipt.
- **Est:** medium-large. **Depends on:** A1 (accounts/ledger).

### A4 · FR-BO-130 — §46A tax receipts (Israeli תיקון 13)
- **Data:** `donation_receipts` with **gapless** sequential numbering per `(org_id, fiscal_year)` (use a per-org sequence table + `SELECT ... FOR UPDATE` or an advisory lock inside the RPC to guarantee no gaps), donor, amount, §46A clause, PDF ref, status issued/void/reissued.
- **PDF:** introduce a shared PDF generation utility (Edge Function or client) reused by A4 receipts + A1 reports.
- **PM blockers (open):** confirm org holds §46A status; digital-signature / registry e-receipt acceptance.
- **Tests:** numbering is gapless under concurrency; void/reissue keeps the trail; cross-tenant.
- **Est:** large. **Depends on:** A3.

### A5 · FR-BO-140/141/142 — Suppliers & accounts-payable
- **Data:** `suppliers` (name, registry/VAT id, terms), `purchase_orders` (draft→approved→received), `supplier_invoices` → `supplier_payments` (payment posts an `expense` ledger entry); AP-aging report.
- **Est:** large. **Depends on:** A1.

### A6 · FR-BO-150/151/152 — HR & payroll
- **Permission:** add `hr.manage` / `hr.approve` to `@kc/domain` `PERMISSION_MATRIX` + a migration granting them to the right roles.
- **Data:** `employees` (role, salary_cents, employment type) + `employment_contracts`; `timesheet_entries.employee_id`; `payroll_runs` + `payslips` (payroll posts expenses to ledger); `leave_requests` (request→approve/reject, balance).
- **PM blocker (open):** v1 **records** payroll; statutory Israeli deduction computation (מס הכנse / ביטוח לאומי) is a scope decision — likely deferred to v2.
- **Est:** large. **Depends on:** A1, FR-BO-020 (timesheets exist).

### A-remainder · Finance FE screens
The data layer for FR-BO-100 (accounts) shipped without a screen. Add `(admin)/finance/accounts` (list + create/edit account, type filter, active toggle) consuming `container.listFinanceAccounts` / `upsertFinanceAccount`. Then reports/budgets screens as their slices land. **Est:** small each.

---

## 5. Dependency graph (build order)

```
Auth Hook (ops) ─────────────┐
                             ▼
B0 ✅ ─► B1 ✅ ─► B2 (isolation) ─► B3 white-label ─► B4 billing ─► B5 console
                     │
A0 ✅ ─► A1·100 ✅ ─► A1·101 periods ─► A1·102 reports ─► A2 budgets
                                  └─► A3 donors ─► A4 receipts
                                  └─► A5 suppliers/AP
A1·020 (timesheets ✅) ─────────────► A6 HR/payroll
```
**Recommended next three:** (1) **FR-BO-101 fiscal periods** (small, unblocks reports+budgets), (2) **B2a back-office isolation** (low-risk first cut of the make-or-break), (3) **FR-BO-102 reports** (visible value for our own NGO). Enable the **Auth Hook in dev** before B2a step-2.

---

## 6. Open PM decisions (do not block dev; record as D-* / TECH_DEBT when hit)
1. **Stripe IL VAT invoicing** — gates B4. (D-61 chose Stripe behind `IPaymentProvider`; VAT/PSP details open.)
2. **Payroll statutory computation** scope — record-only vs compute deductions — gates A6 depth.
3. **§46A legal validity** (digital signature, registry e-receipt acceptance) — gates A4 go-live.
4. **Org switch UX** — instant (session refresh) vs next-login — defaulting to session-refresh; confirm.
5. **Custom domains + TLS** — deferred; subdomain-first for B3.

---

## 7. Definition of done (every slice)
- [ ] Migration applies cleanly on a fresh PG16 locally (§2.7) + chain/safety scripts green.
- [ ] Tenant-table contract satisfied (§2.1) incl. cross-tenant SQL probe.
- [ ] Domain/application/infra unit tests (happy + boundary) beside the code.
- [ ] `pnpm typecheck && pnpm test && pnpm lint` green from `app/`.
- [ ] SSOT updated in the same PR: `BACKLOG.md` status, `spec/17|18` status header + AC, `TECH_DEBT.md` closures/additions.
- [ ] PR to `dev` with the `Mapped to spec` line; draft until reviewed, then CI must pass before merge.
