// Session-only memory for profile Open/Closed tab so leaving the screen
// (e.g. post detail → back) restores the same tab instead of defaulting to Open.
import type { ProfilePostsTab } from '../components/profile/ProfileTabs';

let lastSelfTab: ProfilePostsTab = 'open';
const lastOtherByHandle = new Map<string, ProfilePostsTab>();

function normalizePostsTab(tab: string | undefined): ProfilePostsTab {
  if (tab === 'closed') return 'closed';
  return 'open';
}

export function getRestoredProfileTab(scope: 'self' | { otherHandle: string }): ProfilePostsTab {
  if (scope === 'self') return lastSelfTab;
  return normalizePostsTab(lastOtherByHandle.get(scope.otherHandle));
}

export function persistProfileTab(scope: 'self' | { otherHandle: string }, tab: ProfilePostsTab): void {
  if (scope === 'self') lastSelfTab = tab;
  else lastOtherByHandle.set(scope.otherHandle, tab);
}
