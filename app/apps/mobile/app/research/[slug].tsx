// Native fallback — public research is web-only (FR-RESEARCH-001 AC1).
import { Redirect } from 'expo-router';

export default function ResearchSlugNativeFallback() {
  return <Redirect href="/(tabs)" />;
}
