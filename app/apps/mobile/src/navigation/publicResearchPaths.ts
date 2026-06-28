/** Pure helpers for public market-research routes (no expo-router import). */
export function isPublicResearchPath(pathname: string): boolean {
  return pathname === '/research' || pathname.startsWith('/research/');
}
