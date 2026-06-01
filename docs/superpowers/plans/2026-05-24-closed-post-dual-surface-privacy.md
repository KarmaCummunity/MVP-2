# Closed Post Dual-Surface Privacy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce the dual-surface closed-post privacy model (independent audience per participant; identity-on-partner-surface via `hide_from_counterparty`; OnlyMe auto-enables identity hide but user can opt out) and align SSOT/tests with PM spec `docs/superpowers/specs/2026-05-24-closed-post-dual-surface-privacy-design.md`.

**Architecture:** Keep D-28 SQL (`profile_closed_posts`, `participant_closed_surface_visible`) as source of truth for **row visibility** per profile host. Use `hide_from_counterparty` only for **identity chrome** on counterparty surfaces (post detail + partner profile context). Remove incorrect coupling of `surface_visibility = OnlyMe` → anonymous projection. Client: OnlyMe upsert sets `hide_from_counterparty = true` without locking; stop using `posts.visibility` to gate partner’s closed tab for `closed_delivered`.

**Tech Stack:** Expo mobile, `@kc/domain` projection, `infrastructure-supabase` adapters, Supabase migrations/RLS, vitest, SSOT `docs/SSOT/spec/04_posts.md`.

**Mapped to spec:** `FR-POST-021`, `FR-PROFILE-001` AC4, `FR-PROFILE-002` AC2. Refactor logged: No (behavior correction).

---

## File map

| Area | Files |
|------|--------|
| Product spec (done) | `docs/superpowers/specs/2026-05-24-closed-post-dual-surface-privacy-design.md` |
| Domain projection | `app/packages/domain/src/postActorIdentity.ts` |
| Domain tests | `app/packages/application/src/posts/__tests__/postActorIdentity.test.ts` |
| Infra projection | `app/packages/infrastructure-supabase/src/posts/applyPostActorIdentityProjection.ts` |
| Closed posts hydrate | `app/packages/infrastructure-supabase/src/posts/getProfileClosedPostsHelper.ts` |
| Mobile privacy UX | `app/apps/mobile/src/hooks/usePostActorPrivacyModel.ts` |
| RLS recipients (if not applied) | `supabase/migrations/0106_recipients_select_visible_viewers.sql` |
| SSOT | `docs/SSOT/spec/04_posts.md`, `docs/SSOT/DECISIONS.md` (D-31 addendum or D-33), `docs/SSOT/TECH_DEBT.md` |
| i18n (if copy tweak) | `app/apps/mobile/src/i18n/locales/he/modules/post.ts` |

---

### Task 1: Domain — decouple OnlyMe from identity mask

**Files:**
- Modify: `app/packages/domain/src/postActorIdentity.ts`
- Modify: `app/packages/application/src/posts/__tests__/postActorIdentity.test.ts`

- [ ] **Step 1: Update `shouldMaskActorIdentityForThirdPartyViewer`**

Remove `actorSurfaceVisibility === 'OnlyMe'` from mask condition. Mask only when `hideFromCounterparty === true`. Keep counterparty and self exemptions.

- [ ] **Step 2: Add/adjust tests**

```typescript
it('does NOT anonymize third party when only actorSurfaceVisibility is OnlyMe', () => {
  const r = projectActorIdentityForViewer(baseActor, 'Public', ctx({
    viewerUserId: 'u_stranger',
    actorSurfaceVisibility: 'OnlyMe',
    hideFromCounterparty: false,
  }));
  expect(r.mode).toBe('full');
});

it('anonymizes third party when hideFromCounterparty true on neutral surface', () => {
  const r = projectActorIdentityForViewer(baseActor, 'Public', ctx({
    viewerUserId: 'u_stranger',
    hideFromCounterparty: true,
    identityListingHostUserId: null,
  }));
  expect(r.mode).toBe('anonymous');
});
```

- [ ] **Step 3: Run tests**

```bash
cd app && pnpm --filter @kc/application test -- postActorIdentity
```

Expected: PASS

---

### Task 2: Infra projection — surface vs identity inputs

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/posts/applyPostActorIdentityProjection.ts`

- [ ] **Step 1: Pass `actorSurfaceVisibility` for logging/future only OR stop passing OnlyMe into mask**

Ensure `projectActorIdentityForViewer` receives `actorSurfaceVisibility` but mask uses `hideFromCounterparty` only (Task 1).

Keep `ownerSurface` fallback: `ownerPolicy.surfaceVisibility !== 'Public' ? ownerPolicy.surfaceVisibility : post.visibility` for any **future** surface rules — not for masking.

- [ ] **Step 2: Run typecheck**

```bash
cd app && pnpm --filter @kc/infrastructure-supabase typecheck
```

---

### Task 3: Mobile — OnlyMe auto-enables identity hide (opt-out allowed)

**Files:**
- Modify: `app/apps/mobile/src/hooks/usePostActorPrivacyModel.ts`

- [ ] **Step 1: Keep OnlyMe → `hideFromCounterparty: true` on upsert**

When owner/recipient calls `onAudienceChange('OnlyMe')`, upsert with `hideFromCounterparty: true` and `setHide(true)`.

- [ ] **Step 2: Do NOT auto-clear hide when upgrading from OnlyMe to Public**

Only change hide when user toggles the identity switch or selects OnlyMe (not when moving Public/FollowersOnly unless product says otherwise).

- [ ] **Step 3: Stop fan-out `posts.visibility` for closed_delivered (DSP-1)**

For `post.status === 'closed_delivered'`, `onAudienceChange` should update **`post_actor_identity.surface_visibility` only** — not call `updatePostVisibility.mutate` for closed posts.

Exception: if Hidden screen (`FR-PROFILE-001`) still reads `posts.visibility`, add a one-line comment + verify hidden screen query uses `surface_visibility` or `listMode: owner_only_me` — adjust `profile/hidden.tsx` query if needed.

- [ ] **Step 4: Manual smoke**

1. A closes with B.  
2. A sets “רק אני” → confirm identity toggle on.  
3. C views B’s closed tab → post visible, A anonymous.  
4. A turns identity toggle off → C on B’s tab sees A full name.  
5. C on A’s closed tab → no row.

---

### Task 4: Verify SQL dual-surface (no migration unless gap)

**Files:**
- Read: `supabase/migrations/0085_post_actor_identity_audience_split.sql` (`profile_closed_posts`, `participant_closed_surface_visible`)
- Optional: `supabase/migrations/0106_recipients_select_visible_viewers.sql`

- [ ] **Step 1: Confirm respondent row on B’s profile uses `role_actor_id = B`**

No code change if RPC already gates by respondent’s `surface_visibility`.

- [ ] **Step 2: Apply migration 0106 on dev if not applied**

```bash
supabase db push
```

- [ ] **Step 3: Integration check**

Publisher sets OnlyMe in `post_actor_identity`; respondent row on B’s profile still returned for third party when respondent `surface_visibility = Public`.

---

### Task 5: SSOT alignment

**Files:**
- Modify: `docs/SSOT/spec/04_posts.md` (`FR-POST-021` AC4, Description)
- Modify: `docs/SSOT/DECISIONS.md` (add **D-33** or amend D-31/D-28)
- Modify: `docs/SSOT/TECH_DEBT.md` (TD-156 note)

- [ ] **Step 1: FR-POST-021 AC4**

State explicitly:

- `surface_visibility = OnlyMe` gates **row visibility on that participant’s profile surface only**.
- `hide_from_counterparty` gates **identity chrome** for third parties on the **counterparty’s** surface (and neutral post detail per prior fix).
- Selecting OnlyMe **defaults** `hide_from_counterparty = true`; user may set false without changing OnlyMe.

- [ ] **Step 2: Add D-33 (Dual-surface closed post)**

One paragraph + link to product spec `2026-05-24-closed-post-dual-surface-privacy-design.md`.

---

### Task 6: Regression tests + gates

- [ ] **Step 1: Full verify**

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
```

- [ ] **Step 2: Revert incorrect AC4 wording** from 2026-05-24 session if it says OnlyMe alone anonymizes on all surfaces.

---

## Spec coverage checklist

| Product AC | Task |
|------------|------|
| AC-DSP-1 | Task 3 (no posts.visibility on closed), Task 4 SQL verify |
| AC-DSP-2 | Task 3 |
| AC-DSP-3 | Task 1 + 3 |
| AC-DSP-4 | Task 1 + 3 |
| AC-DSP-5 | Task 4 (0106 recipients) + existing RecipientCallout |
| AC-DSP-6 | Task 4 SQL verify |

---

## Risk notes

- **Hidden screen:** If it only filters `posts.visibility = OnlyMe`, closed posts moved to OnlyMe via `surface_visibility` alone may not appear — align query in Task 3 Step 3.
- **Prior session coupling** in `04_posts.md` AC4 — must be corrected in Task 5.

---

## Execution handoff

Plan saved. Choose:

1. **Subagent-driven** — fresh agent per task with review between tasks.  
2. **Inline** — implement all tasks in this session with checkpoints.

Which approach?
