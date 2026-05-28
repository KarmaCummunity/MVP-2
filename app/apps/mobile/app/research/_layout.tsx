// Native fallback for research routes — FR-RESEARCH-001 AC1.
// Web renders `_layout.web.tsx` instead. This file exists only to satisfy expo-router's
// platform-extension sibling requirement and redirects native deep-links to the app shell.
import { Redirect } from 'expo-router';

export default function ResearchLayoutNativeFallback() {
  return <Redirect href="/(tabs)" />;
}
