<!--
PR description template — keep all sections.
The agent (or a human) fills these in. CI will block merge if "Mapped to spec" is missing.
-->

## Summary
<!-- 2-4 sentences: what changed and why. -->

## Mapped to spec
<!-- Required. List FR-* IDs touched, or write "N/A — tooling/docs only".
     Link to docs/SSOT/spec/<file>.md when applicable. -->
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
<!-- Yes / No / NA. If Yes, link to the TECH_DEBT.md row. -->
- NA

## SSOT updated
<!-- Required when an FR-* is touched. Tick when each is in sync in this PR. -->
- [ ] `docs/SSOT/BACKLOG.md` status flipped
- [ ] `docs/SSOT/spec/{domain}.md` status updated (if all ACs done)
- [ ] `docs/SSOT/TECH_DEBT.md` — closed resolved TDs / added new ones

## Risk / rollout notes
<!-- DB migrations, RLS changes, feature flag, breaking change? Otherwise "Low risk." -->
-

## Screenshots / logs
<!-- Only if UI or runtime output changed. -->
