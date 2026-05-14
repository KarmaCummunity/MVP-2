// Stack layout for My Profile. The two children — `index` (open posts) and
// `closed` (closed posts) — are distinct routes so navigating away and back
// (e.g. post detail, tab swap) lands you on whichever tab you last opened.
// Mapped to: FR-PROFILE-001 AC4.
import React from 'react';
import { Stack } from 'expo-router';

export default function ProfileTabLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
