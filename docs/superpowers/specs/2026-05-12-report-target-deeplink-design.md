# Report-target deeplink in admin chat (FR-MOD-001 AC4 + FR-MOD-005 AC3)

> **Status:** Design v3 — incorporates two rounds of council review. v3 cuts D8 (trigger-level privacy filter) and D11 (delete_account_data scrub) per MVP scope discipline; both move to TECH_DEBT.
> **Mapped to spec:** `FR-MOD-001` AC4 (link to target), `FR-MOD-005` AC3 (auto-removed system message + link), `FR-ADMIN-001` AC2.
> **Owner:** BE lane (DB trigger) + FE lane (bubbles).
> **Migration:** `0043_report_admin_payload_enrichment.sql`.

## Problem

Two adjacent moderation surfaces ship admin system messages without the link the spec requires:

1. **FR-MOD-001 AC4**: report-received bubble (`ReportReceivedBubble`) shows reason + target type but no navigation to the reported content. Spec literal: *"with a link to the target and the reason"*.
2. **FR-MOD-005 AC3**: auto-removed system message ("Auto-removed after 3 reports. **[target link]**") is **not implemented on BE at all** today — the bubble (`AutoRemovedBubble.tsx`) exists as FE scaffolding, but no migration emits `kind='auto_removed'`. Audit row is created (`audit_events`), but no admin-facing message.

## Goal

Admin gets a tappable **target preview** in two bubbles:
- **`report_received`** — when a user files a report.
- **`auto_removed`** — when threshold breach hides a target.

Both contain author handle, content snippet, and a tap target that navigates to the target screen. Snapshot is taken at trigger time (point-in-time evidence).

## Out of scope (deferred to TD or follow-up)

- **Trigger-level privacy filter for snapshots** (was D8 in v2) — the snapshot writes whatever the trigger reads (DEFINER, bypasses RLS). For Private users, the bio could appear in `messages.system_payload` even though the reporter normally can't SELECT it. **Mitigated for MVP by D9** (the bubble doesn't render the preview to non-admin viewers). Real-world threat is narrow because non-followers cannot reach the report modal for a Private user (the profile screen has no row to render under `users_select_public`). **Tracked as TD-1xx — Trigger-level visibility predicate for system_payload snapshots.**
- **`delete_account_data` scrub for snapshots** (was D11 in v2) — R-MVP-Privacy-6 / RTBF compliance. No EU launch commitment in DECISIONS.md; project audience is Hebrew-only Israeli per `R-MVP-Core-4`. **Tracked as TD-1xx — RTBF scrub of messages.system_payload (pre-EU-launch GDPR pass).**
- Hebrew translation of `Report.reason` enum — TD.
- Admin "view any chat" capability — chat reports map to user-of-the-other-party (D2).
- Enriching `mod_action_taken` (Restore) bubble — follow-up.

## Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Snapshot at trigger time (`AFTER INSERT` on `reports`), store in `messages.system_payload` for both `report_received` and `auto_removed`. | Targets may be auto-removed/edited/deleted before admin reviews; snapshot is moderation evidence. Avoids N+1 fetches. Atomic with the report. |
| D2 | `target_type='chat'` reports map to **the other participant** (the participant ≠ reporter) for navigation purposes. The `Report` row stays unchanged for audit. | No admin-view-any-chat capability in MVP; the reportable user is the actionable target. |
| D3 | `target_type='none'` (FR-MOD-002 support tickets) — unchanged. No `link_target`, no `target_preview`. | Not a content report. |
| D4 | Old reports (pre-migration) without enriched payload fall back to legacy render. | No backfill. Bubble type-guards on the new fields. |
| D5 | New migration filename: `0043_report_admin_payload_enrichment.sql` (highest existing is `0042`). | Verified at design time. |
| D6 | Snippet: first 80 unicode chars of `regexp_replace(trim(source), '\s+', ' ', 'g')`. If original >80 chars, append `'…'`. Empty/whitespace-only → `null` (`nullif(..., '')`). | Predictable height, RTL-safe. |
| D7 | New migration drops obsolete trigger `reports_after_insert_emit_message` (defined in `0013`). Migration `0033` only redefines the function, not the trigger — confirmed. | Latent duplicate-message bug; dispatcher only handles `report_received`. The orphan function is left in place (nothing else references it; verified via grep). |
| **D9** | **Bubble admin-gate:** rich preview card renders only when `useIsSuperAdmin()=true`. Non-admin viewers (e.g., the reporter looking at their own support thread) see the legacy title-only render. | Reporter doesn't need to re-see their own report. Provides UI-layer privacy floor (full DB-layer floor deferred — see Out of scope). |
| **D10** | Same migration emits `kind='auto_removed'` system message with same enriched payload structure into the **support thread of the 3rd reporter** (the one whose insert triggered the threshold). | Implements FR-MOD-005 AC3 in the same change-set as AC4. The 3rd reporter's thread is the natural anchor — admin sees both bubbles together. |
| D12 | Single migration wrapped in an implicit transaction (Supabase migration runner default). Trigger drop + function replace are atomic. | Avoids a window where old + new triggers coexist. |
| **D13** | Bottom of `0043` includes a commented `-- ROLLBACK:` block with the previous (`0040`) function body verbatim. | `CREATE OR REPLACE FUNCTION` cannot be reverted via `git revert`; operator needs a recovery script ready. |
| **D14** | Update `.github/workflows/db-validate.yml` to run all `supabase/tests/*.sql` (currently runs only `migration-coverage.sql`). | Without this, the new pgTAP test files in this PR will not run in CI — they'd be silent dead code. |

(D8 and D11 from v2 are removed — see Out of scope above.)

## Architecture & data flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ INSERT into reports (FR-MOD-001 use case via SupabaseReportRepo)    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼ trigger: reports_after_insert_effects
┌─────────────────────────────────────────────────────────────────────┐
│ reports_after_insert_apply_effects()  (REPLACED in 0043)            │
│   ├── (1) reporter-side hide                                        │
│   ├── (2) audit event                                               │
│   ├── (3) auto-removal threshold (FR-MOD-005)                       │
│   │   └── if breached:                                              │
│   │       ├── update target status (existing)                       │
│   │       ├── audit_event 'auto_remove_target' (existing)           │
│   │       └── NEW: inject system message kind='auto_removed' with   │
│   │           enriched payload into the 3rd reporter's thread       │
│   └── (4) inject system message kind='report_received' with         │
│           enriched payload into reporter's support thread           │
│           (existing call, NEW payload)                              │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ messages rows: { kind='system', system_payload: { enriched } }      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼ realtime → admin client
┌─────────────────────────────────────────────────────────────────────┐
│ ReportReceivedBubble / AutoRemovedBubble                            │
│   ├── if isAdmin && payload has rich fields → preview card + nav    │
│   ├── otherwise → legacy render (title only, plus existing actions) │
│   └── existing dismiss/confirm/restore buttons unchanged            │
└─────────────────────────────────────────────────────────────────────┘
```

### Payload schema (additive, applies to both `report_received` and `auto_removed`)

```jsonc
{
  // existing fields (kept):
  "kind": "report_received" | "auto_removed",
  "report_id": "<uuid>",            // present in report_received only
  "target_type": "post|user|chat|none",
  "target_id": "<uuid|null>",
  "reason": "Spam|Offensive|Misleading|Illegal|Other",  // report_received only
  "distinct_reporters": <int>,      // auto_removed only

  // NEW — navigation target:
  "link_target": {
    "type": "post" | "user",
    "id": "<uuid>",
    "handle": "<string>"            // sourced from users.share_handle
  } | null,                         // null when target_type='none' or row gone

  // NEW — preview snapshot:
  "target_preview": {
    "kind": "post",
    "author_handle": "<string>",
    "author_display_name": "<string>",
    "body_snippet": "<string|null>",
    "has_image": true|false
  } | {
    "kind": "user",
    "handle": "<string>",
    "display_name": "<string>",
    "bio_snippet": "<string|null>"
  } | null
}
```

### Report.target_type → payload mapping

| Report.target_type | link_target.type | target_preview.kind | Source data |
|---|---|---|---|
| `post` | `post` | `post` | `posts JOIN users` (author via `posts.owner_id`) |
| `user` | `user` | `user` | `users` |
| `chat` | `user` | `user` | `chats` (the participant ≠ reporter, **excluding** `is_support_thread=true`) `JOIN users` |
| `none` | `null` | `null` | (no change to today's flow) |

### SQL approach for the snapshot

```sql
-- Posts (no privacy predicate per v3 / Out of scope above):
select jsonb_build_object(
  'kind', 'post',
  'author_handle', u.share_handle,
  'author_display_name', u.display_name,
  'body_snippet', nullif(trim(regexp_replace(
    left(p.title || coalesce(' — ' || p.description, ''), 80),
    '\s+', ' ', 'g'
  )), ''),
  'has_image', exists (select 1 from public.media_assets m where m.post_id = p.post_id)
) into v_target_preview
from public.posts p
join public.users u on u.user_id = p.owner_id
where p.post_id = new.target_id;

-- Users (and chat→user counterpart):
select jsonb_build_object(
  'kind', 'user',
  'handle', share_handle,
  'display_name', display_name,
  'bio_snippet', nullif(trim(regexp_replace(left(coalesce(biography, ''), 80), '\s+', ' ', 'g')), '')
) into v_target_preview
from public.users
where user_id = v_target_user_id;
```

For chat→user: resolve counterpart with `case when reporter_id = participant_a then participant_b else participant_a end`, after rejecting `is_support_thread=true` chats (counterpart would be the admin themselves — `link_target := null`, `target_preview := null`).

If the target row does not exist (race), `v_target_preview` stays NULL → bubble renders legacy.

## UI — bubble layout (both bubbles)

Outer frame and existing action buttons (dismiss/confirm for report_received; restore/ban for auto_removed) **unchanged**. Preview card sits between the title/reason line and the action row, as a **sibling Pressable** (not nested with action Pressables — council #6).

**Post preview:**
```
┌─ דיווח התקבל / הוסר אוטומטית ──────────┐
│ סיבה: Spam   (report_received only)    │
│                                        │
│ ┌─ ‎@author_handle (פוסט) ─────────┐   │
│ │ "תחילת תוכן הפוסט..."             │   │
│ │ 📷 כולל תמונה                    │   │   ← only if has_image
│ │ ‹ פתח                            │   │   ← chevron-back (RTL-correct)
│ └────────────────────────────────────┘   │
│                                        │
│ צילום מצב מרגע הדיווח                  │   ← evidence label
│                                        │
│ הערת מדווח: "..."                       │   ← only if reporter note
│                                        │
│ [פטור]   [אשר הפרה]   /   [↩ שחזר]    │
└────────────────────────────────────────┘
```

**User preview:**
```
┌─ דיווח התקבל / הוסר אוטומטית ──────────┐
│ סיבה: Offensive                        │
│                                        │
│ ┌─ ‎@handle (פרופיל) ──────────────┐    │
│ │ display_name                      │    │
│ │ "ביו..."                           │    │
│ │ ‹ פתח                             │    │
│ └────────────────────────────────────┘    │
│                                        │
│ צילום מצב מרגע הדיווח                  │
│                                        │
│ [פטור]   [אשר הפרה]                    │
└────────────────────────────────────────┘
```

**Chat (mapped to user):** identical to user layout, plus a small label above the reason — *"דיווח על שיחה — מוצג הצד השני"* (same color/size as the evidence label).

**Visibility:**
- Preview card renders only when `useIsSuperAdmin()=true` AND `payload.link_target` and `payload.target_preview` are present.
- Non-admin viewers (the reporter) see only title (and reason for report_received). `handledByLaterAction` dimming applies to the entire bubble including the card.

**Navigation (typed routes — council #1):**
- Post: `router.push({ pathname: '/post/[id]', params: { id: linkTarget.id } })`
- User / chat-mapped: `router.push({ pathname: '/user/[handle]', params: { handle: linkTarget.handle } })`

**Pressable structure (council #6):**
The preview card is its own `Pressable` **outside** the action-buttons row. Action buttons are sibling Pressables in their existing row. No nesting → no propagation issues, no need for `stopPropagation`.

```tsx
<View style={styles.bubble}>
  <Text>{title}</Text>
  {showRichPreview && (
    <Pressable onPress={navigateToTarget} accessibilityRole="button" accessibilityLabel={a11yLabel} style={styles.card}>
      {/* preview content */}
    </Pressable>
  )}
  {showActions && (
    <View style={styles.actionRow}>
      <Pressable onPress={onDismiss}>{...}</Pressable>
      <Pressable onPress={onConfirm}>{...}</Pressable>
    </View>
  )}
</View>
```

**Styling:**
- Preview card: `backgroundColor: '#ffffff'`, `borderRadius: 8` (matches sibling bubbles), `borderWidth: StyleSheet.hairlineWidth`, `borderColor: '#e0d8b0'`, `padding: 8`, `minHeight: 44` (accessibility floor).
- Handle: `fontWeight: '600'`. Snippet: `fontSize: 13`, **`numberOfLines: 3`** (council #4 — 80 chars Hebrew at fontSize 13 doesn't fit in 2 lines on narrow screens).
- Chevron: `Ionicons name="chevron-back"` (RTL-aware, used elsewhere in codebase).
- Evidence label: `fontSize: 11`, `color: '#666'`, italic.

**Accessibility (council #5):**
- Preview card Pressable: `accessibilityRole="button"`, `accessibilityLabel={`פתח ${kind === 'post' ? 'פוסט' : 'פרופיל'} מאת ${handle}`}`.
- `minHeight: 44` enforced via style.

## Edge cases

| # | Case | Behaviour |
|---|---|---|
| E1 | Pre-migration rows (no enriched payload). | Bubble renders legacy view (title only). Today's body content for `report_received` is `null` from 0040 — no regression. |
| E2 | Target deleted between report and admin viewing. | Snapshot in payload still shows what was reported. Tap navigates; target screen handles "not found". |
| E3 | Post already auto-removed (`status='removed_admin'`). | Snapshot still taken (no privacy predicate in v3). Tap navigates; post screen handles its own removed state. |
| E4 | Race — target gone at INSERT time. | `LEFT JOIN`/null-result → snapshot null → legacy render. Report still inserts cleanly. |
| E5 | Image-only post (title+description empty). | `body_snippet=null`, `has_image=true` → only "📷 כולל תמונה" line. (Note: posts.title is `not null check (char_length(title) between 1 and 80)`, so title is always present — body_snippet should rarely be null in practice.) |
| E6 | User without bio. | `bio_snippet=null` → handle + display_name only. |
| E7 | `target_type='none'`. | No payload changes. Existing flow. |
| E8 | Reporter's `note` field. | Stays in body (passed via `inject_system_message`'s `p_body`). Rendered as separate line under the preview card with "הערת מדווח:" label. NOT duplicated into payload. |
| E9 | Two triggers fire today (`reports_after_insert_emit_message` from `0013`, redefined function in `0033`). | Migration `0043` `DROP TRIGGER IF EXISTS reports_after_insert_emit_message ON public.reports;`. Function left in place (verified nothing else references it). |
| E10 | Reporter reports their own support thread (`is_support_thread=true`). | Counterpart resolves to admin themselves. Trigger sets `link_target=null`, `target_preview=null`. Bubble shows legacy. |
| E11 | Reporter reports a Private user. | Snapshot includes bio (DEFINER bypasses RLS). UI doesn't render to non-admin viewer (D9). DB-layer leak deferred to TD-1xx. |
| E12 | User deletes their account. | Snapshot in `messages.system_payload` persists. Deferred to TD-1xx (RTBF pass). |
| E13 | Reporter views their own support thread. | `useIsSuperAdmin()=false` → preview card not rendered. Reporter sees same legacy bubble as today. |

## Backward compatibility

- No backfill. Old `report_received` payloads lack new fields → bubble renders legacy.
- `messages.system_payload` is `jsonb` — additive fields zero-risk.
- `Report` table unchanged.
- `delete_account_data` and the `0029` migration **untouched in this PR**.

## Privacy summary (MVP floor)

| Concern | MVP mitigation | Long-term plan |
|---|---|---|
| Reporter sees admin-context snapshot in their own support thread | D9 — bubble admin-gate; non-admin doesn't render preview. | TD-1xx — DB-layer filter (D8 from v2). |
| Snapshot includes data reporter couldn't SELECT (Private user) | Realistic threat narrow: non-followers can't reach report modal for Private profiles (`users_select_public` blocks the SELECT). UI gated by D9. | TD-1xx — DB-layer visibility predicate. |
| Snapshot persists after target's account deletion (R-MVP-Privacy-6) | Not addressed in MVP. No EU launch commitment. | TD-1xx — RTBF scrub during pre-EU GDPR pass. |
| Snapshot diverges from live target after edits (FR-POST-008) | "צילום מצב מרגע הדיווח" label — preview is moderation evidence, not live mirror. | (Permanent — by design.) |
| Audit log retention (24mo, FR-MOD-012 AC3) extending snapshot retention | `audit_events.metadata` keeps storing IDs only — no snapshot. Verified. | (Permanent — by design.) |

## Testing strategy

### DB layer (`supabase/tests/0043_*.sql`, pgTAP-style)
- Post report → `report_received` payload contains `link_target.type='post'`, `target_preview.body_snippet`, correct `share_handle`, `has_image`.
- User report → `target_preview.kind='user'` with handle/display_name/bio_snippet.
- Chat report → counterpart resolved correctly for both `participant_a` and `participant_b` reporter cases.
- Chat report on `is_support_thread=true` → `link_target=null`.
- Support ticket (`target_type='none'`) → no payload changes.
- 3rd report triggers threshold → `auto_removed` system message also created with same enriched payload structure.
- Regression: only one system message per report (no duplicate from `0013` trigger).

**CI plumbing:** D14 above — update `.github/workflows/db-validate.yml` to glob `supabase/tests/*.sql`. Without this, the new test files won't run.

### Bubble layer (Vitest + RNL where available; manual otherwise)
- `ReportReceivedBubble` with rich payload + admin → renders preview card.
- `ReportReceivedBubble` with rich payload + non-admin → renders legacy.
- `ReportReceivedBubble` without payload → renders legacy.
- `AutoRemovedBubble` same matrix.
- Tap on preview card calls typed router with correct route + params.
- Action buttons still work, no propagation conflict (separate Pressables).
- Chevron renders correctly in RTL.

### Manual (per "verify UI in browser before claiming done")
- Sign in as super admin (`karmacommunity2.0@gmail.com`).
- Two test accounts (a, b).
- a reports b's post → admin sees rich preview, tap opens post.
- a reports b's profile → tap opens profile.
- a reports a chat with b → admin sees b's profile preview (not a's), tap opens b.
- Three reports on same post (a, b, c reporting d's post) → admin sees `report_received` bubbles AND a final `auto_removed` bubble in c's thread, both with rich previews.
- Sign in as reporter a → confirm legacy view (no preview card).

### Pre-push gates
`pnpm typecheck && pnpm test && pnpm lint` from `app/`, all green.

## Files affected

| Layer | File | Change |
|---|---|---|
| DB | `supabase/migrations/0043_report_admin_payload_enrichment.sql` (new) | Replace `reports_after_insert_apply_effects` (enriched payload + threshold-side `auto_removed` emission). Drop `reports_after_insert_emit_message` trigger. Bottom-of-file `-- ROLLBACK:` comment block with previous function body. |
| DB tests | `supabase/tests/0043_report_admin_payload_enrichment.sql` (new) | All cases listed above. |
| CI | `.github/workflows/db-validate.yml` | Glob `supabase/tests/*.sql` instead of running only `migration-coverage.sql`. |
| Mobile UI | `app/apps/mobile/src/components/chat/system/ReportReceivedBubble.tsx` | Add admin-gated preview card; sibling Pressable structure; typed router nav. |
| Mobile UI | `app/apps/mobile/src/components/chat/system/AutoRemovedBubble.tsx` | Same — add preview card. |
| i18n | `app/apps/mobile/src/i18n/partials/moderationHe.ts` | New strings: "פתח", "כולל תמונה", "הערת מדווח:", "צילום מצב מרגע הדיווח", "דיווח על שיחה — מוצג הצד השני". |

## Risk & rollout

- **Low risk.** Single migration, idempotent function replace. Trigger drop is safe (consumers verified). No changes to user-facing critical functions (delete_account_data untouched).
- No feature flag — fully backward-compatible.
- **Rollback:** revert FE PR; for the migration, the operator runs the `-- ROLLBACK:` block at the bottom of `0043` (D13).

## SSOT updates required at PR time

- `docs/SSOT/BACKLOG.md` — add new row `P1.3.1 — Admin report-bubble deeplink + auto-removed message (FR-MOD-001 AC4 + FR-MOD-005 AC3)`. Mark ✅ Done at merge.
- `docs/SSOT/spec/08_moderation.md` — `FR-MOD-001` AC4 status note: *"AC4 satisfied for reports created on/after migration 0043; legacy rows render in degraded mode."* `FR-MOD-005` AC3 status note: *"Implemented in migration 0043."*
- `docs/SSOT/TECH_DEBT.md` — open new TDs (BE lane TD-5x range):
  - **TD-5x — Trigger-level visibility filter for system_payload snapshots** (was D8 in v2). UI-layer gate (D9) is in place; DB-layer filter deferred until a non-mobile client consumes payloads.
  - **TD-5x — RTBF scrub of messages.system_payload** (was D11 in v2). Bundle into pre-EU-launch GDPR pass.
  - **TD-1xx — Hebrew translation of `Report.reason` enum in admin bubbles.**
  - **TD-1xx — Pre-migration `report_received` rows render with no body since 0040** (cosmetic).
- `docs/SSOT/DECISIONS.md` — brief D-XX entry: "Admin report-bubble snapshot: UI-layer admin-gate (D9) is the MVP privacy floor; DB-layer filter deferred."
