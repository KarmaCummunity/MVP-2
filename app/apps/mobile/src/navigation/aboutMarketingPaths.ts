/** Pure helpers for About marketing routes (no expo-router import — safe in unit tests). */
export function isAboutMarketingPath(pathname: string): boolean {
  return pathname === '/about' || pathname === '/about-site';
}
