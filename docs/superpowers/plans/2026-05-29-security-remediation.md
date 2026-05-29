# Security Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close critical and high-severity findings from [`../audits/2026-05-29-security-quality-audit.md`](../audits/2026-05-29-security-quality-audit.md) in prioritized waves without regressing RLS-dependent surfaces.

**Architecture:** Fix trust boundaries at the database first (grants, projections, rate limits), then application session binding and owner checks, then mobile fail-closed UX and sign-out parity. CI/supply-chain and perf items ship in parallel once Wave 1–2 are green.

**Tech Stack:** Supabase migrations + Edge Functions, `@kc/domain` / `@kc/application` / `@kc/infrastructure-supabase`, Expo mobile, GitHub Actions.

**Audit reference:** Consolidated findings doc (2026-05-29). Maps to FR-AUTH-*, FR-CLOSURE-003, FR-POST-021, FR-ADMIN-006, FR-PROFILE-007, NFR-SEC-009.

---

## Wave 0 — Tracking & policy (half day)

### Task 0: SSOT rows for new findings

**Files:**
- Modify: `docs/SSOT/TECH_DEBT.md`
- Modify: `docs/SSOT/BACKLOG.md` (optional P0 rows)

- [ ] **Step 1: Add TECH_DEBT rows**

Add under Active → Backend:

```markdown
| TD-161 | 🔴 | Public research RPC: revoke anon EXECUTE on submit_public_research_response; stop trusting client p_ip_hash (audit C-01). | Pre-launch |
| TD-162 | 🔴 | NFR-SEC-009: DB rate_limits + triggers on messages (10/s) and reports (5/h) (audit C-03). | Pre-launch |
| TD-163 | 🔴 | users public projection: strip phone/address/is_super_admin from general SELECT (audit H-BE-03). | Pre-launch |
```

Add under Active → Mobile:

```markdown
| TD-164 | 🔴 | Unified performFullSignOut() — legal exit, account gate, restore expiry (audit C-02, H-FE-04). | Pre-launch |
| TD-165 | 🟠 | Home feed wire onEndReached / useInfiniteQuery (audit C-04). | Pre-launch |
```

- [ ] **Step 2: Commit**

```bash
git add docs/SSOT/TECH_DEBT.md docs/SSOT/BACKLOG.md
git commit -m "docs(ssot): register audit 2026-05-29 remediation debt rows"
```

---

## Wave 1 — Database: RPC grants & rate limits (2–3 days)

### Task 1: Lock down public research submission (C-01, H-BE-01)

**Files:**
- Create: `supabase/migrations/0161_lock_public_research_rpc.sql`
- Modify: `supabase/functions/public-research-submit/index.ts` (if IP hash still passed)
- Test: `app/packages/infrastructure-supabase/src/rpc/__tests__/` (add negative anon RPC test)

- [ ] **Step 1: Write failing integration test**

```typescript
// app/packages/infrastructure-supabase/src/rpc/__tests__/publicResearchRpc.integration.test.ts
it('rejects anon direct rpc submit_public_research_response', async () => {
  const anon = createAnonClient();
  const { error } = await anon.rpc('submit_public_research_response', {
    p_survey_version_id: SURVEY_VERSION_ID,
    p_answers: {},
    p_ip_hash: 'fake',
    p_honeypot: '',
  });
  expect(error?.code).toMatch(/42501|PGRST301/);
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `cd app && pnpm --filter @kc/infrastructure-supabase test -- publicResearchRpc`
Expected: FAIL (anon still has grant)

- [ ] **Step 3: Migration**

```sql
-- supabase/migrations/0161_lock_public_research_rpc.sql
revoke execute on function public.submit_public_research_response from anon;
-- Optional: compute ip_hash inside function; drop p_ip_hash parameter in follow-up migration if breaking.
```

Also in same or `0162` migration:

```sql
revoke execute on function public.has_admin_role(uuid, text) from anon;
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0161_lock_public_research_rpc.sql app/packages/infrastructure-supabase/src/rpc/__tests__/publicResearchRpc.integration.test.ts
git commit -m "fix(supabase): revoke anon execute on research submit and has_admin_role"
```

---

### Task 2: Rate limits for messages and reports (C-03, H-SOC-01/02)

**Files:**
- Create: `supabase/migrations/0162_rate_limits_messages_reports.sql`
- Test: extend `sqlProbes.integration.test.ts` or new `rateLimits.integration.test.ts`

- [ ] **Step 1: Write failing probe**

```sql
-- Expect 11th insert in 1s from same user to raise rate_limit_exceeded
```

- [ ] **Step 2: Implement `enforce_rate_limit` helper + triggers**

```sql
create table if not exists public.rate_limit_buckets (
  key text primary key,
  window_start timestamptz not null,
  count int not null default 0
);

create or replace function public.enforce_rate_limit(
  p_key text, p_max int, p_window_seconds int
) returns void language plpgsql security definer set search_path = '' as $$
-- increment bucket; raise exception 'rate_limit_exceeded' when over cap
$$;

create trigger messages_rate_limit before insert on public.messages
for each row execute function public.trg_messages_rate_limit();
```

Mirror for `reports` (5 per hour per reporter).

- [ ] **Step 3: Run backend CI locally**

Run: `cd app && pnpm test && pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(supabase): add rate limits for messages and reports (NFR-SEC-009)"
```

---

## Wave 2 — Data minimization: users projection (H-BE-03, H-FE-12)

### Task 3: `users_public` view + adapter pruning

**Files:**
- Create: `supabase/migrations/0163_users_public_projection.sql`
- Modify: `app/packages/infrastructure-supabase/src/users/fetchUserBy.ts`
- Modify: `app/packages/infrastructure-supabase/src/users/follow/followMethods.ts`
- Modify: `app/packages/infrastructure-supabase/src/users/searchUsers.ts`
- Test: `app/packages/infrastructure-supabase/src/users/__tests__/fetchUserBy.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
it('fetchUserBy strips contact_phone for non-owner viewer', async () => {
  const row = await repo.findById(OTHER_USER_ID, VIEWER_ID);
  expect(row.contactPhone).toBeUndefined();
});
```

- [ ] **Step 2: Migration — view + policies**

```sql
create view public.users_public as
select user_id, display_name, share_handle, avatar_url, city, city_name,
       biography, privacy_mode, account_status
from public.users
where account_status = 'active';

-- Tighten users_select_active to column list OR route reads through view.
revoke select on public.users from anon, authenticated;
grant select on public.users_public to anon, authenticated;
-- Self-only table or policy for private columns (contact_phone, profile_street, notification_preferences).
```

Coordinate with legal/chat: add `get_chat_counterparty_contact(chat_id)` SECURITY DEFINER RPC for **FR-PROFILE-007**.

- [ ] **Step 3: Replace `(*)` joins in followMethods**

```typescript
const USER_PUBLIC_COLUMNS = 'user_id, display_name, share_handle, avatar_url, city, city_name, privacy_mode';
// follower:follower_id(${USER_PUBLIC_COLUMNS})
```

- [ ] **Step 4: Run tests**

Run: `cd app && pnpm --filter @kc/infrastructure-supabase test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git commit -m "fix(supabase): users public projection and adapter column pruning"
```

---

## Wave 3 — Auth sign-out & fail-closed gates (C-02, H-FE-02/03/04)

### Task 4: `performFullSignOut()` single path

**Files:**
- Create: `app/apps/mobile/src/services/performFullSignOut.ts`
- Modify: `app/apps/mobile/src/components/legal/LegalConsentScreen.tsx`
- Modify: `app/apps/mobile/src/hooks/useEnforceAccountGate.ts`
- Modify: `app/packages/application/src/auth/RestoreSession.ts`
- Modify: `app/apps/mobile/src/hooks/useSettingsAccountActions.ts` (delegate to shared helper)
- Test: `app/apps/mobile/src/services/__tests__/performFullSignOut.test.ts` (mock composition)

- [ ] **Step 1: Extract helper**

```typescript
// performFullSignOut.ts
export async function performFullSignOut(deps: SignOutDeps): Promise<void> {
  await deps.deactivateCurrentDevice().catch(() => undefined);
  await deps.authSignOut();
  await deps.clearAllPersistedStores();
  deps.queryClient.clear();
}
```

- [ ] **Step 2: Wire legal exit + account gate + restore expiry**

In `RestoreSession.ts` when `expiresAt <= now`:

```typescript
await auth.signOut({ scope: 'local' });
return null;
```

- [ ] **Step 3: LegalConsentGate fail-closed**

```typescript
// on consent RPC error — mustBlockImmediately → show retry, NOT setState('clear')
```

- [ ] **Step 4: AuthGate onboarding — remove fail-open to completed**

```typescript
// on bootstrap error → setOnboardingState('error') with retry UI
```

- [ ] **Step 5: Run mobile tests**

Run: `cd app && pnpm --filter @kc/mobile test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git commit -m "fix(mobile): unified full sign-out and fail-closed legal/onboarding gates"
```

---

## Wave 4 — Application defense-in-depth (H-APP-01..08)

### Task 5: Closure candidates scoped to post (FR-CLOSURE-003)

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/posts/closureMethods.ts`
- Modify: `app/packages/application/src/posts/GetClosureCandidatesUseCase.ts`
- Test: `app/packages/application/src/posts/GetClosureCandidatesUseCase.test.ts`

- [ ] **Step 1: Failing test**

```typescript
it('returns only partners who messaged about this post', async () => {
  const candidates = await uc.execute({ postId: POST_A, ownerId: OWNER });
  expect(candidates.map((c) => c.userId)).toEqual([PARTNER_ON_POST_A]);
});
```

- [ ] **Step 2: SQL filter by anchor_post_id / post reference**

```typescript
// closureMethods.ts — filter chats/messages where anchor_post_id = postId
```

- [ ] **Step 3: Assert ownerId matches post.ownerId in use case**

- [ ] **Step 4: Commit**

```bash
git commit -m "fix(posts): scope closure candidates to post (FR-CLOSURE-003)"
```

---

### Task 6: Session-bound mutating use cases

**Files:**
- Create: `app/packages/application/src/auth/assertSessionUser.ts`
- Modify: `UpdateProfileUseCase.ts`, `SetAvatarUseCase.ts`, `UpdatePostUseCase.ts`, `DeletePostUseCase.ts`, `BanUserUseCase.ts`
- Tests: extend each `*.test.ts` with `forbidden when userId !== session`

- [ ] **Step 1: Shared assert**

```typescript
export function assertSessionUser(sessionUserId: string, inputUserId: string): void {
  if (sessionUserId !== inputUserId) throw new AuthError('forbidden');
}
```

- [ ] **Step 2: Apply to profile + post mutators**

- [ ] **Step 3: Wire `hasPermission` in `GrantAdminRoleUseCase`**

```typescript
import { hasPermission } from '@kc/domain/admin/AdminPermission';
if (!hasPermission(actorRoles, 'admin.grant_role')) throw new AdminRoleError('forbidden');
```

- [ ] **Step 4: Run application tests**

Run: `cd app && pnpm --filter @kc/application test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git commit -m "fix(application): session bind and permission checks on mutators"
```

---

## Wave 5 — Mobile client hardening (H-FE-08..11, H-SOC-03)

### Task 7: URL allowlist + WebView lockdown

**Files:**
- Create: `app/apps/mobile/src/utils/assertSafeExternalUrl.ts`
- Modify: `legalMarkdownRules.tsx`, `openExternalUrl.ts`, `AboutInstagramEmbed.tsx`
- Test: `app/apps/mobile/src/utils/__tests__/assertSafeExternalUrl.test.ts`

- [ ] **Step 1: Tests**

```typescript
expect(() => assertSafeExternalUrl('javascript:alert(1)')).toThrow();
expect(assertSafeExternalUrl('https://example.com')).toBe('https://example.com/');
```

- [ ] **Step 2: Implement allowlist https/mailto/tel**

- [ ] **Step 3: WebView originWhitelist + onShouldStartLoadWithRequest**

- [ ] **Step 4: Commit**

```bash
git commit -m "fix(mobile): external URL allowlist and WebView navigation lockdown"
```

---

### Task 8: Anchor post visibility in RPC

**Files:**
- Create: `supabase/migrations/0164_rpc_chat_set_anchor_visibility.sql`
- Test: SQL probe or integration test

- [ ] **Step 1: Failing probe — set anchor on invisible post returns error**

- [ ] **Step 2: Add `is_post_visible_to` check inside `rpc_chat_set_anchor`**

- [ ] **Step 3: Commit**

```bash
git commit -m "fix(supabase): validate anchor post visibility in rpc_chat_set_anchor"
```

---

## Wave 6 — CI & supply chain (H-CI-01..05)

### Task 9: Docker lockfile + CI audit gate

**Files:**
- Modify: `app/apps/mobile/web-server/package.json` (add lockfile)
- Modify: `Dockerfile`
- Modify: `.github/workflows/ci-frontend.yml`
- Create: `.github/workflows/ci-security-audit.yml` (optional)

- [ ] **Step 1: Generate web-server lockfile**

```bash
cd app/apps/mobile/web-server && npm install --package-lock-only
```

- [ ] **Step 2: Dockerfile use npm ci**

```dockerfile
COPY web-server/package-lock.json ./
RUN npm ci --omit=dev
```

- [ ] **Step 3: Add pnpm audit to ci-frontend**

```yaml
- name: Dependency audit
  run: cd app && pnpm audit --audit-level=high
  continue-on-error: false
```

- [ ] **Step 4: Replace prod Supabase URL in CI with dev ref** (`roeefqpdbftlndzsvhfj` per ENVIRONMENTS.md)

- [ ] **Step 5: Commit**

```bash
git commit -m "ci: docker lockfile, pnpm audit gate, dev supabase url in frontend ci"
```

---

## Wave 7 — Performance quick wins (C-04, perf audit)

### Task 10: Home feed infinite scroll

**Files:**
- Modify: `app/apps/mobile/app/(tabs)/index.tsx`
- Modify: `app/apps/mobile/src/components/PostFeedList.tsx` (if needed)
- Test: manual + optional component test

- [ ] **Step 1: Replace useQuery with useInfiniteQuery**

```typescript
const feedQuery = useInfiniteQuery({
  queryKey: ['feed', filters],
  queryFn: ({ pageParam }) => getFeedUseCase().execute({ cursor: pageParam, limit: 20, ...filters }),
  getNextPageParam: (last) => last.nextCursor ?? undefined,
});
```

- [ ] **Step 2: Wire PostFeedList**

```typescript
<PostFeedList
  hasMore={feedQuery.hasNextPage}
  onEndReached={() => feedQuery.fetchNextPage()}
  loadingMore={feedQuery.isFetchingNextPage}
/>
```

- [ ] **Step 3: Manual test — scroll past 20 items**

- [ ] **Step 4: Commit**

```bash
git commit -m "fix(mobile): wire home feed pagination (onEndReached)"
```

---

### Task 11: React Query key consolidation

**Files:**
- Create: `app/apps/mobile/src/lib/queryKeys.ts`
- Modify: `RideCard.tsx`, `AnchoredPostCard.tsx`, `useFirstPostNudge.ts`

- [ ] **Step 1: Export `userProfileKeys.byId(id)`**

- [ ] **Step 2: Replace `['user', id]` usages**

- [ ] **Step 3: Commit**

```bash
git commit -m "perf(mobile): consolidate user profile react-query keys"
```

---

## Wave 8 — Verification & SSOT closeout

### Task 12: Full gate + spec touch-up

**Files:**
- Modify: `docs/SSOT/spec/01_auth_and_onboarding.md` (push-on-logout status if Wave 3 done)
- Modify: `docs/SSOT/TECH_DEBT.md` (close TD-161..165 as slices land)

- [ ] **Step 1: Run full pre-push**

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
```

Expected: all green

- [ ] **Step 2: Update spec headers for domains touched**

- [ ] **Step 3: PR to `dev` with audit + plan links in body**

```markdown
## Mapped to spec
- FR-AUTH-017, FR-CLOSURE-003, FR-PROFILE-007, FR-ADMIN-006, NFR-SEC-009
- Audit: docs/superpowers/audits/2026-05-29-security-quality-audit.md
```

- [ ] **Step 4: Commit SSOT updates**

```bash
git commit -m "docs(ssot): close audit remediation wave 1-2 items"
```

---

## Self-review (plan vs audit)

| Audit ID | Task |
| -------- | ---- |
| C-01 | Task 1 |
| C-02, H-FE-04 | Task 4 |
| C-03 | Task 2 |
| C-04 | Task 10 |
| H-BE-01 | Task 1 (`has_admin_role`) |
| H-BE-03, H-FE-12 | Task 3 |
| H-APP-01 | Task 5 |
| H-APP-04..07 | Task 6 |
| H-FE-08, H-FE-09 | Task 7 |
| H-SOC-03 | Task 8 |
| H-CI-* | Task 9 |
| TD-68 | Follow-up migration after Task 1 (predicate path guards — separate PR) |
| H-SOC-04/05 actor identity | Dedicated PR referencing TD-81 (not inlined — avoid mega-PR) |

**Deferred to follow-up plans (documented, not forgotten):**
- Web `localStorage` session → HttpOnly/BFF (**H-FE-01**)
- `post-images` signed URLs (**H-BE-04**, TD-11)
- Report brigading velocity + optional review queue (**H-SOC-01**)
- TD-68 full predicate internalization
- Apple SSO / phone OTP (**TD-24**, **TD-151**)
- FR-AUTH-016 cooldown backend

---

## Execution handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-29-security-remediation.md`.**

**Findings doc:** `docs/superpowers/audits/2026-05-29-security-quality-audit.md`

**Two execution options:**

1. **Subagent-Driven (recommended)** — one fresh subagent per task above, review between tasks  
2. **Inline Execution** — run waves sequentially in one session with checkpoints after Wave 1–2

Which approach do you want?
