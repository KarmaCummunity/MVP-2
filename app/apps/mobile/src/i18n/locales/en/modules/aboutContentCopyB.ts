/** English About landing — features, mission, how, audience, values (v1.0 master narrative). */
export const aboutContentCopyB = {
  // Features (bullets — aboutContentUxRefreshPartA)
  featuresTitle: 'What the App Offers',

  // How it works — today (3 steps)
  howItWorksTitle: 'How It Works',
  howItWorksText:
    '1. Post — write what you have to give or what you\'re looking for, with a photo and an area.\n\n' +
    '2. Coordinate — chat inside the app, agree on a place and time. Sharing a phone number is never required.\n\n' +
    '3. Close — mark the handoff as done. No money, no commission, no middleman.\n\n' +
    'All free, all transparent, all between people.',

  // How it works — vision (5 steps, in-app future)
  howItWorksVisionText:
    'As the product matures, the flow will also include:\n\n' +
    '1. Quick join — only what\'s needed.\n' +
    '2. Post or search — a clear request or offer.\n' +
    '3. Map — see what\'s happening near your home (not yet available).\n' +
    '4. Direct contact — chat and coordination.\n' +
    '5. Handoff and close — a human connection + a stronger community.',

  // Audience — emphasized block (AboutAudienceSection)
  audienceTitle: 'Who It\'s For',
  audienceLead: 'For anyone who wants to give or receive — with no distinctions and no judgment.',
  audienceGroups: [
    { icon: 'home-outline', label: 'Families decluttering their belongings' },
    { icon: 'school-outline', label: 'Students moving apartments' },
    { icon: 'airplane-outline', label: 'New immigrants starting over' },
    { icon: 'heart-outline', label: 'Older adults who need a hand' },
    { icon: 'people-outline', label: 'Neighbors and local communities' },
    {
      icon: 'hand-left-outline',
      label: 'Anyone who prefers to give and receive through people, not a sales marketplace',
    },
  ],
  audienceFootnote:
    'At first we focus on individuals. Nonprofits and organizations — to follow.',

  // Values (copy + chips — aboutContentUxRefreshPartB)
  valuesTitle: 'Our Values',
} as const;
