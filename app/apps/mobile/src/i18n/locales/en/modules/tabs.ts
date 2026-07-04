// Tab bar labels — used by `TabBar` (root layout) and could be reused by any
// surface that needs to name a tab. The chat / settings / search / donations
// labels deliberately reuse the namespaces that own those features
// (`chat.title`, `settings.title`, `search.tabLabel`, `donations.tabLabel`).
export const tabsEn = {
  home: 'Home',
  profile: 'Profile',
  newPost: 'New post',
} as const;
