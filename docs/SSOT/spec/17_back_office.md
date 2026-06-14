# 17 — Back-Office (FR-BO-*)

**Status:** ⏳ Planned (Track A of Nonprofit OS)
**Owner:** Autonomous loop
**Design doc:** `docs/superpowers/specs/2026-06-14-nonprofit-os-back-office-and-multitenancy-design.md`
**Decisions:** `D-62` (dual-track scope)

This domain turns the thin admin modules (`/admin/money`, `/admin/crm`, `/admin/time`) into a real non-profit back-office: finance, donors, suppliers/accounts-payable, and HR/payroll. Every table is born with `org_id` (per `D-60`) so multi-tenant isolation (domain 18) flips on without a rewrite. All amounts are stored in minor units (`*_cents bigint`). All writes go through `SECURITY DEFINER` RPCs that assert role + tenant.

> **Note (doc drift):** `finance_ledger_entries`, `crm_contacts`, `timesheet_entries`, and `org_applications` already shipped in code (migrations 0168–0171) **without FR-IDs**. FR-BO-001/010/020/030 below retro-spec the existing behavior (status ✅) before later slices extend it. See `TECH_DEBT.md`.

---

## A0 — Spec catch-up (retro-spec already-shipped modules)

### FR-BO-001 — Finance ledger (existing) ✅
Ledger of `donation_in / grant_in / expense / refund_out / transfer` entries with `amount_cents`, `currency`, `occurred_at`, `counterparty`, `category`, `status` (pending/cleared/canceled), soft-delete; list + summary-by-currency RPCs. Admin/super_admin + moderator (`money.manage`) only.

### FR-BO-010 — CRM contacts (existing) ✅
Donor/partner/journalist contacts with tags and lifecycle (cold→warm→active→inactive); list/upsert/delete/mark-contacted; soft-delete. `crm.manage`.

### FR-BO-020 — Timesheets (existing) ✅
Per-user time entries (`hours_x100`, project, description) with draft→submit→approve/reject; approvers see all. `time.report` / `time.approve`.

---

## A1 — Finance core

### FR-BO-100 — Chart of accounts ⏳
`finance_accounts` per org (income/expense/asset/liability categories); ledger entries gain `account_id`. Seed a default Israeli-NGO chart.

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
