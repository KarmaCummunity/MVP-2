# Karma Community MVP — Backlog

> **Purpose:** Priority-ordered task queue. Agents pick the highest-priority ⏳ item.
> Update this file when starting (⏳→🟡) or completing (🟡→✅) work.

---

## P0 — Core Foundation (Must Ship)

| ID | Task | Owner | Status | Spec |
|----|------|-------|--------|------|
| P0.1 | Auth & Onboarding (Google, Email, Phone, Wizard) | agent-be + agent-fe | ✅ Done | `spec/01_auth_and_onboarding.md` |
| P0.2 | Profile CRUD + Privacy toggle | agent-be + agent-fe | ✅ Done | `spec/02_profile_and_privacy.md` |
| P0.3 | Onboarding wizard (3-step) | agent-fe | ✅ Done | `spec/01_auth_and_onboarding.md` FR-AUTH-010..012 |
| P0.4-BE | Posts repository + RLS + images | agent-be | ✅ Done | `spec/04_posts.md` |
| P0.4-FE | Feed UI + create post + post detail | agent-fe | ✅ Done | `spec/04_posts.md`, `spec/06_feed_and_search.md` |
| P0.5 | Direct chat + realtime | agent-be + agent-fe | ✅ Done | `spec/07_chat.md` |
| P0.6 | Closure flow (mark delivered + reopen) | agent-be + agent-fe | ✅ Done | `spec/05_closure_and_reopen.md` |

## P1 — Safety, Discovery & Polish

| ID | Task | Owner | Status | Spec |
|----|------|-------|--------|------|
| P1.1 | Following & follow requests | agent-be + agent-fe | ✅ Done | `spec/03_following.md` |
| P1.2 | Feed discovery (proximity sort, filters, universal search) | agent-fe | ✅ Done | `spec/06_feed_and_search.md` FR-FEED-004..019 |
| P1.2.x | Close-post-from-chat + anchor lifecycle | agent-be + agent-fe | ✅ Done | `spec/07_chat.md` FR-CHAT-014..015 |
| P1.3 | Reports + auto-removal + false-report sanctions | agent-be | ⏳ Planned | `spec/08_moderation.md` |
| P1.5 | Push notifications | agent-be + agent-fe | ⏳ Planned | `spec/09_notifications.md` |

## P2 — Stats, Admin & Polish

| ID | Task | Owner | Status | Spec |
|----|------|-------|--------|------|
| P2.1 | Personal & community statistics screen | agent-fe | ✅ Done | `spec/10_statistics.md` |
| P2.2 | Full super-admin moderation queue | agent-be | ⏳ Planned | `spec/12_super_admin.md` |
| P2.3 | Guest preview polish | agent-fe | ⏳ Planned | `spec/01_auth_and_onboarding.md` FR-AUTH-014 |

## P3 — Post-MVP (Deferred)

| ID | Task | Status | Spec |
|----|------|--------|------|
| P3.1 | Block / unblock + visibility restoration | ⏳ Deferred (EXEC-9) | `spec/08_moderation.md` FR-MOD-003/004/009 |
| P3.2 | Apple SSO (iOS only) | ⏳ Deferred | `spec/01_auth_and_onboarding.md` FR-AUTH-004 |
| P3.3 | Quiet hours / DND | ⏳ Deferred | `spec/09_notifications.md` FR-NOTIF-016 |

---

## Sprint Protocol

1. Pick the highest ⏳ item above
2. Read its linked `spec/` file
3. Move status to 🟡
4. Implement
5. Move status to ✅
6. Update spec file status if all ACs complete
