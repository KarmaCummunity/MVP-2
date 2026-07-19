---
name: Contributor task
about: A well-scoped GLOWE task for external contributors
title: "[contrib] "
labels: ["contributor-facing", "good first issue"]
---

## Goal

<!-- One sentence: what should be true when this is done? -->

## Why it matters

<!-- Short product/UX context for someone new to the repo. -->

## Acceptance criteria

- [ ]
- [ ]
- [ ]

## Files likely to touch

- `app/apps/glowe-web/...`

## Out of scope

- `app/apps/mobile/**` (paused — do not change)
- Hosted Supabase credentials / env secrets
-

## How to verify locally

1. `./scripts/dev-up.sh` (if DB needed)
2. `cd app && pnpm install`
3. `pnpm --filter @kc/glowe-web dev` → http://localhost:4321
4. `cd app && pnpm typecheck && pnpm test && pnpm lint`
5. Manual checks:

## Estimated size

- [ ] `size:S` (under ~half a day)
- [ ] `size:M` (~one day)

## Labels to apply

`contributor-facing` + `good first issue` or `help wanted` + `area:*` + `size:*`
