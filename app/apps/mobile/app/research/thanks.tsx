// Native fallback — public research is web-only (FR-RESEARCH-001 AC1).
import { Redirect } from 'expo-router';

export default function ResearchThanksNativeFallback() {
  return <Redirect href="/(tabs)" />;
}
