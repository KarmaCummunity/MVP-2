// Session-only memory for profile Open/Closed tab so leaving the screen
// (e.g. post detail → back) restores the same tab instead of defaulting to Open.
import type { ProfileTab } from '../components/profile/ProfileTabs';

let lastSelfTab: ProfileTab = 'open';
const lastOtherByHandle = new Map<string, ProfileTab>();

export function getRestoredProfileTab(scope: 'self' | { otherHandle: string }): ProfileTab {
  if (scope === 'self') return lastSelfTab;
  return lastOtherByHandle.get(scope.otherHandle) ?? 'open';
}

export function persistProfileTab(scope: 'self' | { otherHandle: string }, tab: ProfileTab): void {
  if (scope === 'self') lastSelfTab = tab;
  else lastOtherByHandle.set(scope.otherHandle, tab);
}
