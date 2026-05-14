export type AboutSectionId =
  | 'numbers'
  | 'vision'
  | 'problems'
  | 'features'
  | 'mission'
  | 'how'
  | 'audience'
  | 'values'
  | 'roadmap'
  | 'goals'
  | 'contributions'
  | 'team'
  | 'instagram'
  | 'faq'
  | 'contact';

export const ABOUT_NAV_ITEMS: ReadonlyArray<{ readonly id: AboutSectionId; readonly icon: string }> = [
  { id: 'numbers', icon: 'bar-chart-outline' },
  { id: 'vision', icon: 'bulb-outline' },
  { id: 'problems', icon: 'alert-circle-outline' },
  { id: 'features', icon: 'apps-outline' },
  { id: 'mission', icon: 'information-circle-outline' },
  { id: 'how', icon: 'help-circle-outline' },
  { id: 'audience', icon: 'people-outline' },
  { id: 'values', icon: 'heart-outline' },
  { id: 'roadmap', icon: 'map-outline' },
  { id: 'goals', icon: 'flag-outline' },
  { id: 'contributions', icon: 'gift-outline' },
  { id: 'team', icon: 'person-circle-outline' },
  { id: 'instagram', icon: 'logo-instagram' },
  { id: 'faq', icon: 'chatbubble-ellipses-outline' },
  { id: 'contact', icon: 'mail-outline' },
];

/** i18n leaf keys under `aboutContent.*` (flat resource object). */
export const ABOUT_NAV_LABEL_KEYS: Record<AboutSectionId, string> = {
  numbers: 'navNumbers',
  vision: 'navVision',
  problems: 'navProblems',
  features: 'navFeatures',
  mission: 'navMission',
  how: 'navHow',
  audience: 'navAudience',
  values: 'navValues',
  roadmap: 'navRoadmap',
  goals: 'navGoals',
  contributions: 'navContributions',
  team: 'navTeam',
  instagram: 'navInstagram',
  faq: 'navFaq',
  contact: 'navContact',
};
