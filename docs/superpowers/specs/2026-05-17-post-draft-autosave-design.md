# Post Draft Autosave (FR-POST-007) — Design

> **Mapped to spec:** `docs/SSOT/spec/04_posts.md` FR-POST-007. Closes TD-108. Adds BACKLOG row P2.22.
> **Status of source spec:** ⏳ Unimplemented → 🟡 In progress (this design) → ✅ Done (on merge).
> **Layer scope:** `apps/mobile` only. No domain / application / infrastructure-supabase changes.

## Problem

The Create Post screen "remembers" form values today only because the tab stays mounted. Sign-out, app restart, or accidental close drops the in-flight draft entirely. After publish, the same in-memory state lingers on the tab, so the next post pre-fills with the previously published title/description — user-visible bug.

Address is already persisted via `lastAddressStore` (separate concern, separate lifecycle).

## Goals (Acceptance Criteria, per spec)

- **AC1.** Every input change writes to local storage after a 300 ms debounce.
- **AC2.** Re-entering the form with an unpublished draft surfaces a modal: *"You have an unpublished draft. Continue editing / Start fresh."*
- **AC3.** Drafts include image references (Supabase Storage paths). Missing assets render as a placeholder with a "re-add" prompt.
- **AC4.** Successful publish OR explicit "Start fresh" OR account deletion clears the draft.
- **AC5.** Drafts are scoped per signed-in user — switching accounts does not leak drafts.

## Non-goals

- No domain entity. The spec footer mentions `Domain: LocalDraft` but that is UI persistence, not a business invariant. Recorded as decision D-29 (next available D-id).
- No server-side draft sync. Local AsyncStorage only.
- No retroactive cleanup of orphan Storage uploads from abandoned drafts. (Tracked separately under TD register if it matters; not a release blocker.)

## Architecture

```
apps/mobile
├── src/store/postDraftStore.ts            ← zustand persist (AsyncStorage)
├── src/hooks/usePostDraftAutosave.ts      ← 300 ms debounce write
├── src/hooks/usePostDraftHydration.ts     ← read + probe images + expose continue/startFresh
├── src/lib/probeDraftImageAvailability.ts ← pure function + adapter port
├── src/components/post/DraftResumeModal.tsx ← AC2 modal UI
└── app/(tabs)/create.tsx                  ← wires hydration + autosave + clear-on-publish
```

Hydration banner lives in `create.tsx`. Autosave hook subscribes to local form state. The store is the single source of truth; both hooks read/write it.

### Why two stores (not one)

`lastAddressStore` (kept) and `postDraftStore` (new) have **different lifecycles**:

| Store              | Cleared on publish? | Cleared on sign-out? | Pre-fill on next post? |
|--------------------|---------------------|----------------------|------------------------|
| `lastAddressStore` | No                  | Yes (defense)        | Yes                    |
| `postDraftStore`   | Yes (AC4)           | Yes (AC5)            | Only via banner (AC2)  |

Merging them would force one set of semantics over the other. Two stores keep each lifecycle obvious.

## Store shape

```ts
// src/store/postDraftStore.ts
interface PostDraftPayload {
  ownerId: string;          // per-AC5 scoping
  updatedAt: number;        // ms epoch — for staleness sniff later if needed
  type: PostType;
  title: string;
  description: string;
  category: Category;
  condition: ItemCondition;
  urgency: string;
  locationDisplayLevel: LocationDisplayLevel;
  visibility: PostVisibility;
  hideFromCounterparty: boolean;
  uploads: UploadedAsset[]; // re-used as-is; Storage paths survive restart
}

interface PostDraftState {
  draft: PostDraftPayload | null;
  setDraft: (next: PostDraftPayload) => void;
  clearDraft: () => void;
}
```

**Per-user scoping (AC5):** `ownerId` lives inside the payload. On hydrate, if `draft.ownerId !== current user.id`, we discard the draft. Also: `signOut()` calls `clearDraft()` (defense-in-depth — avoids TD-103 class bug).

Storage key: `kc-post-draft-v1`. Not user-namespaced, but ownerId in payload + signOut clear is sufficient given current threat model.

## Autosave hook (AC1)

```ts
// src/hooks/usePostDraftAutosave.ts
usePostDraftAutosave({
  ownerId, isHydrating, hasDraftBannerOpen,
  type, title, description, category, condition,
  urgency, locationDisplayLevel, visibility,
  hideFromCounterparty, uploads,
});
```

- 300 ms debounce via `setTimeout` + `clearTimeout`.
- No-op while `isHydrating` (waiting for AsyncStorage rehydrate) or `hasDraftBannerOpen` (avoid overwriting on-disk state before user decides).
- No-op when **all** of title/description/uploads/urgency are empty AND defaults remain — i.e., user has not started typing. Prevents creating an empty-payload "draft" the user would never expect.
- Writes the full payload on every flush (idempotent; simpler than diffing).

## Image probing (AC3)

```ts
// src/lib/probeDraftImageAvailability.ts
type StorageProbe = (path: string) => Promise<boolean>; // adapter

probeDraftImageAvailability(
  uploads: UploadedAsset[],
  probe: StorageProbe,
): Promise<{ present: UploadedAsset[]; missing: UploadedAsset[] }>;
```

- Adapter wraps `supabase.storage.from(POST_IMAGES_BUCKET).createSignedUrl(path, 60)` or HEAD; returns boolean.
- Run during hydration. Missing assets stay in the uploads array tagged with a flag (`missing: true`) so the photo grid can render a placeholder with a "remove / re-add" prompt. Existing `photos` UI accepts this with a minor adjustment.

## Banner UI (AC2)

`DraftResumeModal` opens once per mount if `hasDraft && !banner.dismissed`. Two buttons:
- **Continue editing** → hydrate state from `draft`. Banner closes. Autosave resumes.
- **Start fresh** → call `clearDraft()`, leave form at defaults (address still pre-fills from `lastAddressStore`). Banner closes.

i18n keys already exist: `post.draftRestored`, `post.continueDraft`, `post.discardDraft`. Need new keys:
- `post.draftRestoredBody` — explanatory line.
- `post.draftMissingImage` — placeholder caption when AC3 fires.

## Clear-on-publish wiring (AC4)

In `useCreatePostPublish.onSuccess`, append:
```ts
usePostDraftStore.getState().clearDraft();
```
Address store call already present — unchanged.

## Sign-out / account deletion wiring (AC5)

Extend `useAuthStore.signOut` to call `usePostDraftStore.getState().clearDraft()`. Account-deletion path (`useSettingsAccountActions`) already calls `signOut`, so it inherits the clear.

Regression test: switch session A → sign out → switch session B → assert `draft === null`.

## Testing protocol

| Layer                            | Test                                                                                                |
|----------------------------------|-----------------------------------------------------------------------------------------------------|
| `postDraftStore`                 | set / clear; clear on signOut; partialize shape stable; default empty state.                        |
| `usePostDraftAutosave`           | 300 ms debounce; no-op while hydrating; no-op while banner open; skip when state is at defaults.    |
| `probeDraftImageAvailability`    | mixed present/missing; adapter error → treat as missing; preserves order.                           |
| `usePostDraftHydration`          | hasDraft branches; ownerId mismatch discards; image probe integration.                              |
| `DraftResumeModal`               | renders title + body + two CTAs; calls callbacks; RTL safe.                                         |

Existing `lastAddressStore` and `useCreatePostPublish` tests stay green (no behavior change there beyond a one-line clearDraft call).

## File-size budget

- `create.tsx` currently 233 lines. Adding hydration banner + autosave wiring will push it past 300. We extract the form-state bundle into a small `useCreatePostFormState` hook (keeps create.tsx as composition).
- All new files ≤ 200 lines.

## Decision

**D-29 — Post drafts are UI-state, not domain.** `LocalDraft` is intentionally not promoted to a domain entity. The persistence concern is local-only, has no business invariants, and the form already owns the canonical state shape. Recorded in `docs/SSOT/DECISIONS.md`.

## Rollout

- BACKLOG: new row P2.22 → 🟡 In progress (this PR) → ✅ Done.
- Spec status header: `FR-POST-007 ⏳ unimplemented` → `✅`.
- TECH_DEBT: TD-108 → Resolved with PR link.
- DECISIONS: append D-29.
- No DB migration. No feature flag. Low risk.
