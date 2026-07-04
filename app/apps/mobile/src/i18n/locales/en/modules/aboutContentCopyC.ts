/** English About landing — roadmap, goals, contributions, contact (v1.0 master narrative). */
export const aboutContentCopyC = {
  // Roadmap (legacy text keys kept for backward compat with text rendering)
  roadmapTitle: 'Roadmap',
  roadmapLead:
    'What\'s already built, what\'s on the way, and what comes next — without pretending it\'s all here yet.',
  roadmapPhase1Title: 'Phase 1 — Stable Core (what already works)',
  roadmapPhase1Body:
    'Identity, posts, chat, privacy, reports, basic statistics, and 9 donation categories — so the community can grow on a foundation of trust.',
  roadmapPhase2Title: 'Phase 2 — Community Depth',
  roadmapPhase2Body:
    'In-app flows for time, money and knowledge inside the app. Better discovery, safety, transparent moderation, and bridges to organizations and neighborhoods.',
  roadmapPhase3Title: 'Phase 3 — Broad Impact',
  roadmapPhase3Body:
    'Partnerships with nonprofits, community events, education for responsible giving, community leaders, and in-app flows for all 9 categories.',
  roadmapPhase4Title: 'Phase 4 — Beyond Belongings',
  roadmapPhase4Body:
    'International expansion, KC as a transparent conduit for donations to other nonprofits worldwide, and a voting mechanism for all users on top of a permanent, ironclad charter.',

  // Goals (list UI — aboutContentUxRefreshPartA)
  goalsTitle: 'Our Goals',

  // Contributions — "9 ways to give, all live in the app today"
  contributionsTitle: '9 Ways to Give — All Live in the App Today',
  contributionsText:
    'In the "Donations" tab in the app: full belongings, time and money with integrations, plus 6 more categories with curated links to nonprofits.\n\n' +
    'There are so many ways to give. We won\'t limit you to only what we\'ve built — KC is the hub of doing good, not just our app. Direct action will open at a pace that respects safety and trust.',

  // Badge labels for the contributions tiles
  contributionsAvailableBadge: 'Available',
  contributionsComingSoonBadge: 'Coming soon',
  contributionsBridgeBadge: 'External bridge',
  contributionsPortalBadge: 'Curated links',

  // Structured contributions (9 categories, 3-tier depth per v1.0 §8)
  contributionsList: [
    { icon: 'gift-outline', label: 'Belongings & gear', available: true },
    { icon: 'hand-right-outline', label: 'Time & volunteering', available: false },
    { icon: 'cash-outline', label: 'Money — for Karma and other nonprofits', available: false },
    { icon: 'nutrition-outline', label: 'Food', available: false },
    { icon: 'home-outline', label: 'Housing', available: false },
    { icon: 'car-outline', label: 'Transportation', available: false },
    { icon: 'book-outline', label: 'Knowledge & expertise', available: false },
    { icon: 'paw-outline', label: 'Animals', available: false },
    { icon: 'medkit-outline', label: 'Medical', available: false },
  ],

  // Contact (channels — aboutContentUxRefreshPartB)
  contactTitle: 'Get in Touch',
  contactCta: 'Contact in-app support',
} as const;
