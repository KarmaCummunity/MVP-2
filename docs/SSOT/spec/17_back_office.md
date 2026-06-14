# 17 — Back-Office (FR-BO-*)

**Status:** 🟡 In progress (Track A of Nonprofit OS) — A0 retro-spec done; A1+ planned.
**Owner:** Autonomous loop
**Design doc:** `docs/superpowers/specs/2026-06-14-nonprofit-os-back-office-and-multitenancy-design.md`
**Decisions:** `D-62` (dual-track scope)

This domain turns the thin admin modules (`/admin/money`, `/admin/crm`, `/admin/time`) into a real non-profit back-office: finance, donors, suppliers/accounts-payable, and HR/payroll. Every table is born with `org_id` (per `D-60`) so multi-tenant isolation (domain 18) flips on without a rewrite. All amounts are stored in minor units (`*_cents bigint`). All writes go through `SECURITY DEFINER` RPCs that assert role + tenant.

> **Note (doc drift):** `finance_ledger_entries`, `crm_contacts`, `timesheet_entries`, and `org_applications` already shipped in code (migrations 0168–0171) **without FR-IDs**. FR-BO-001/010/020/030 below retro-spec the existing behavior (status ✅) before later slices extend it. See `TECH_DEBT.md`.

---

## A0 — Spec catch-up (retro-spec already-shipped modules)

**Status:** ✅ Done — these three modules shipped end-to-end (migrations 0169–0171) ahead of the spec; the ACs below document the as-built behavior and close the doc-drift (`TD-171`). Permissions reference the `@kc/domain` `PERMISSION_MATRIX`.

### FR-BO-001 — Finance ledger (existing) ✅
`/admin/money` — accounting ledger over `finance_ledger_entries`.
- **AC1.** Entry kinds: `donation_in`, `grant_in`, `expense`, `refund_out`, `transfer`. Direction is derived (`donation_in`/`grant_in` → in; `expense`/`refund_out` → out; `transfer` → neither).
- **AC2.** Amounts stored as `amount_cents` (bigint, minor units, ≥ 0); `currency` defaults `ILS`. Fields: `occurred_at`, `counterparty`, `category`, `description`, `reference_url`, `status` (`pending`/`cleared`/`canceled`).
- **AC3.** `finance_ledger_list(direction, kind, status, from, to, limit, offset)` returns server-paginated rows + `total_count`.
- **AC4.** `finance_ledger_summary(from, to)` aggregates income/expense/net/count grouped by currency.
- **AC5.** `finance_ledger_upsert` / `finance_ledger_delete` (soft-delete via `deleted_at`). All writes via SECURITY DEFINER RPCs; gated by `money.manage` (super_admin + moderator).

### FR-BO-010 — CRM contacts (existing) ✅
`/admin/crm` — donor/partner/journalist contacts over `crm_contacts`.
- **AC1.** Fields: `name`, `organization`, `email`, `phone`, `role_title`, `notes`, `tags[]`, `status` (`cold`/`warm`/`active`/`inactive`), `last_contacted_at`.
- **AC2.** `crm_contact_list(status, query, tag, limit, offset)` (ILIKE on name/org) returns rows + `total_count`.
- **AC3.** `crm_contact_upsert` / `crm_contact_delete` (soft-delete) / `crm_contact_mark_contacted` (stamps `last_contacted_at`). Gated by `crm.manage`.

### FR-BO-020 — Timesheets (existing) ✅
`/admin/time` — per-user time tracking over `timesheet_entries`.
- **AC1.** Fields: `work_date`, `hours_x100` (0..2400 = 0..24h), `project`, `description`, `status` (`draft`/`submitted`/`approved`/`rejected`).
- **AC2.** Lifecycle: `draft → submitted → approved/rejected`; an author edits their own drafts; an approver (`time.approve`) approves/rejects others.
- **AC3.** `timesheet_list` shows own entries (`time.report`) or all (`time.approve`); RPCs `timesheet_upsert`/`submit`/`approve`/`reject`/`delete` (soft-delete).

---

## A1 — Finance core

**Status:** 🟡 In progress — chart of accounts shipped (migration `0204`); fiscal periods + reports planned.

### FR-BO-100 — Chart of accounts ✅
`finance_accounts` per org (`income`/`expense`/`asset`/`liability`/`equity`; `code` unique per org; optional `parent_id` hierarchy; `is_active`). `finance_ledger_entries` gains a nullable `account_id` FK. Default Israeli-NGO chart seeded for the default org. RPCs `finance_account_list(type, active_only)` + `finance_account_upsert(...)`, gated by `money.manage`; born with `org_id` (isolation flips on in B2). Domain `FinanceAccount` + `IFinanceAccountsRepository` + list/upsert use cases + Supabase adapter + tests. *(Migration `0204`.)*

### FR-BO-101 — Fiscal periods & locking ⏳
`finance_fiscal_periods`; closing a period locks its entries from edit (audit-logged override for super_admin/org_admin).

### FR-BO-102 — Financial reports ⏳
P&L, cash-flow, and donation-summary as RPC-backed read models over the ledger; CSV + PDF export. No new storage tables.

---

## A2 — Budgets

### FR-BO-110 — Budgets & budget-vs-actual ⏳
`finance_budgets` + `finance_budget_lines` per fiscal period; budget-vs-actual report; dashboard cash-position + budget-burn cards.

---

## A3 — Donors & donations

### FR-BO-120 — Donor records ⏳
`donors` linked to `crm_contacts`; donation history view.

### FR-BO-121 — Donations & recurring ⏳
`donations` (amount, method, `receipt_id`, `recurring_id`) posting to the ledger; `recurring_donations` schedule. Distinct from external `donation_links` (domain 13).

---

## A4 — Tax receipts (Israeli §46A / תיקון 13)

### FR-BO-130 — §46A receipts ⏳
`donation_receipts` with **gapless** sequential numbering per `(org_id, fiscal_year)`, donor, amount, §46A clause, PDF reference; void/reissue keeps the audit trail. Legal validity (digital signature, registry approval) is a PM precondition.

---

## A5 — Suppliers & accounts-payable

### FR-BO-140 — Suppliers ⏳
`suppliers` master (name, registry/VAT id, payment terms, contact).

### FR-BO-141 — Purchase orders ⏳
`purchase_orders` (draft→approved→received).

### FR-BO-142 — Supplier invoices & payments ⏳
`supplier_invoices` → `supplier_payments`; payment posts an expense to the ledger; AP-aging report.

---

## A6 — HR & payroll

### FR-BO-150 — Employees & contracts ⏳
`employees` (role, salary, employment type) + `employment_contracts`; `timesheet_entries.employee_id`.

### FR-BO-151 — Payroll runs ⏳
`payroll_runs` + `payslips`; payroll posts expenses to the ledger. **v1 records payroll; statutory Israeli deduction computation (מס/ביטוח לאומי) is a PM scope decision** — may be deferred.

### FR-BO-152 — Leave management ⏳
`leave_requests` (request→approve/reject); balance tracking.
