---
name: ui-ux-pro-max
description: Comprehensive UI/UX design guide for web and mobile applications. Use when designing or redesigning screens, choosing color/typography/motion systems, auditing a UI for consistency, or producing a design system. Encodes a structured workflow (analyze → design system → supplement → stack guidelines), professional-UI rules (no emoji icons, consistent hover, light/dark contrast, layout spacing), and a pre-delivery checklist.
---

# ui-ux-pro-max — UI/UX Design Skill

A structured workflow for producing professional, consistent UI work. This is a methodology framework — it does **not** require any external script. Apply the workflow conceptually, drawing on the rules and checklists below.

## When to invoke

- A user asks to design, redesign, audit, or critique a screen / flow / feature.
- A user invokes `/ui-ux-pro-max`.
- You're producing user-visible UI and want a discipline check before delivery.

## Workflow

### Step 1 — Analyze requirements

Extract from the user request:

| Field | Examples |
|---|---|
| **Product type** | SaaS, e-commerce, portfolio, dashboard, landing page, social app |
| **Style keywords** | minimal, playful, professional, elegant, dark, warm, brutalist |
| **Industry** | healthcare, fintech, gaming, education, beauty, civic |
| **Stack** | React, Vue, Next.js, React Native, SwiftUI, Flutter. Default to `html-tailwind` if unspecified. |

### Step 2 — Generate a design system

Anchor every visual decision to a small, explicit system. Produce these as a single coherent set:

- **Pattern / archetype** (e.g., hero-centric landing, dashboard-with-sidebar, tile-grid hub, content feed)
- **Style direction** (e.g., minimal warm, glass-on-dark, neumorphic, brutalist)
- **Color palette**:
  - 1 primary brand color + 1 supporting accent
  - Neutrals: background, surface, card, text-primary, text-secondary, text-disabled, border
  - Semantics: success, warning, error, info
  - State tints: hover, pressed, focus
- **Typography pair**: heading family + body family (often same family, different weights). Set h1–h4, body, caption sizes/weights/letter-spacing.
- **Spacing scale**: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64
- **Radius scale**: sm / md / lg / xl / full (e.g., 6 / 10 / 14 / 20 / 9999)
- **Shadow / elevation**: card (subtle), modal (medium), popover (deep)
- **Motion tokens**:
  - Durations: fast 150ms / base 250ms / slow 400ms
  - Easings: easeOut for entries, easeIn for exits, spring for interactive
  - Stagger: 60–120ms between siblings
  - Press scale: 0.97
- **Anti-patterns to avoid** (be explicit — list 3–5)

### Step 2b — Persist the design system

Save the system as the project's source of truth so future work conforms:

```
design-system/
  MASTER.md         — global tokens, components, patterns
  pages/
    profile.md      — page-specific deviations from MASTER (only if needed)
    feed.md
    ...
```

Hierarchical retrieval: when building a screen, first check `pages/<screen>.md`; if absent, fall back to `MASTER.md`.

### Step 3 — Supplement with detailed research

After the system is set, dig deeper into specific domains as needed:

| Need | Focus |
|---|---|
| More style options | Style direction variants (glass dark, minimal warm, brutal) |
| Chart recommendations | Chart type per intent (trend → line, comparison → bar, composition → stacked) |
| UX best practices | Animation respect for prefers-reduced-motion, accessibility, z-index discipline, loading states |
| Alternative fonts | Font pairing alternatives for elegant / playful / professional |
| Landing structure | Hero, social proof, value props, pricing, CTA strategies |

### Step 4 — Stack-specific guidelines

Pick implementation patterns appropriate to the stack:

| Stack | Focus areas |
|---|---|
| html-tailwind (default) | Utility-first, responsive breakpoints, a11y attributes |
| React / Next.js | State, hooks, performance (memo, suspense), SSR, routing |
| React Native / Expo | Reanimated, gestures, RTL, SafeAreaView, KeyboardAvoidingView |
| Vue / Svelte | Composition API / runes, store patterns |
| SwiftUI / Jetpack Compose / Flutter | Native idioms, animation, state hoisting |
| shadcn/ui | Themed primitives, forms, design-token composition |

## Professional-UI rules

Frequently overlooked issues that make UI look unprofessional.

### Icons & visual elements

| Rule | Do | Don't |
|---|---|---|
| No emoji icons | SVG / icon-font (Heroicons, Lucide, Ionicons) | Use 🎨 🚀 ⚙️ as UI icons |
| Stable hover states | Color / opacity transitions | Scale transforms that cause layout shift |
| Correct brand logos | Official SVG (Simple Icons) | Guessed paths |
| Consistent icon sizing | Fixed viewBox, fixed visual size | Mixed icon sizes |

### Interaction & cursor

| Rule | Do | Don't |
|---|---|---|
| Cursor pointer | All clickable elements | Default cursor on interactive |
| Hover feedback | Color, shadow, or border change | No visual indication |
| Smooth transitions | `transition-colors duration-200` (150–300ms) | Instant or sluggish (>500ms) |

### Light / dark mode contrast

| Rule | Do | Don't |
|---|---|---|
| Light-mode glass | `bg-white/80` or higher | `bg-white/10` (invisible) |
| Light-mode body text | slate-900 / slate-700 (4.5:1+) | slate-400 (low contrast) |
| Borders | Visible in both modes (gray-200 / white-10) | Same alpha across modes |

### Layout & spacing

| Rule | Do | Don't |
|---|---|---|
| Floating navbar | Spacing from viewport edges | Stuck to top: 0, left: 0 |
| Content padding | Account for fixed navbar height | Content hides under navbar |
| Container width | One consistent max-width per page family | Mix 6xl / 7xl / full randomly |

## Pre-delivery checklist

Before claiming UI work done, verify each:

### Visual quality
- [ ] No emojis as icons (SVG only)
- [ ] All icons from one consistent set
- [ ] Brand logos are official artwork
- [ ] Hover states don't shift layout
- [ ] Theme colors used directly, not wrapped in CSS vars unnecessarily

### Interaction
- [ ] All clickable elements have `cursor: pointer` (web) or pressable affordance (native)
- [ ] Hover / press states give clear feedback
- [ ] Transitions smooth (150–300ms)
- [ ] Focus states visible for keyboard / accessibility navigation

### Light / dark mode (web)
- [ ] Light-mode text contrast ≥ 4.5:1 for body
- [ ] Glass / transparent elements visible in light mode
- [ ] Borders visible in both modes
- [ ] Both modes tested

### Layout
- [ ] Floating elements spaced from edges
- [ ] No content hidden behind fixed navbar / tab bar
- [ ] Responsive at 375 / 768 / 1024 / 1440 (web), or relevant device sizes (native)
- [ ] No horizontal scroll on mobile

### Accessibility
- [ ] All images / icons have alt text or accessibility label
- [ ] Form inputs have labels
- [ ] Color is not the only indicator (icons + text + color together)
- [ ] `prefers-reduced-motion` respected — entry animations disabled, only essential motion kept
- [ ] Touch targets ≥ 44×44 px

### Cross-cutting (React Native specific)
- [ ] RTL: layout works with `I18nManager.isRTL` (no hard-coded `left` / `right`)
- [ ] SafeAreaView and KeyboardAvoidingView used where applicable
- [ ] Reanimated runs on UI thread (no JS thread in `useAnimatedStyle`)
- [ ] Press states use spring scale (0.97) with haptic feedback

## Output format suggestions

When delivering a design output, structure as:

1. **Pattern** — one-line archetype description
2. **Visual idiom** — color, type, radius, shadow tokens (bulleted)
3. **Motion tokens** — durations, easings, stagger, press
4. **Anti-patterns avoided** — explicit "we will NOT do X" list
5. **Per-screen sketch** — for multi-screen work, one short paragraph per screen
6. **Component inventory** — primitives to extract / reuse
7. **Open product questions** — only scope-changing ones

## Tips

- **Be specific with keywords** — "healthcare SaaS dashboard, professional, dense, dark" beats "app".
- **Anchor to one direction** — don't mix glassmorphism + brutalism in one product.
- **Iterate** — first pass on tokens + 1 screen, validate, then propagate.
- **Verify in the real UI** — typecheck / test / lint don't catch RN-Web layout bugs. Open the actual route, inspect DOM, take screenshots before claiming done.
