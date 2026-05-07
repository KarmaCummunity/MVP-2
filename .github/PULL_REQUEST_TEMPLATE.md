<!--
PR description template — keep all sections.
The agent (or a human) fills these in. CI will block merge if "Mapped to SRS" is missing.
-->

## Summary
<!-- 2-4 sentences: what changed and why. -->

## Mapped to SRS
<!-- Required. List FR-* IDs touched, or write "N/A — tooling/docs only".
     Link to docs/SSOT/SRS/02_functional_requirements/<file>.md when applicable. -->
- FR-XXX-NNN — <title>

## Changes
<!-- Concrete list of edits — files added / changed / removed, plus key behavioral effects. -->
-

## Tests
<!-- Mark each gate. Run from app/. -->
- [ ] `pnpm typecheck` ✅
- [ ] `pnpm test` ✅
- [ ] `pnpm lint` ✅
- [ ] Manual smoke (describe) or N/A

## Refactor logged
<!-- Yes / No / NA. If Yes, link the PROJECT_STATUS.md §6 entry. -->
- NA

## PROJECT_STATUS.md updated
<!-- Required when an FR-* is touched. Tick when §2 / §3 / §4 / §1 are in sync in this PR. -->
- [ ] §2 Backlog status flipped
- [ ] §4 Completed Features Log entry added (if Done)
- [ ] §1 Snapshot bumped
- [ ] §3 Sprint Board updated

## Risk / rollout notes
<!-- DB migrations, RLS changes, feature flag, breaking change? Otherwise "Low risk." -->
-

## Screenshots / logs
<!-- Only if UI or runtime output changed. -->
