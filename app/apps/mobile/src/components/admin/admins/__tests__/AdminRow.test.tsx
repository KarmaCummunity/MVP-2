// @vitest-environment jsdom
// FR-ADMIN-015 — regression guard for the "צוות ניהול" portal crash.
//
// The persisted React Query cache (queryPersist.ts) serialises query data with
// JSON.stringify, so on a warm-cache cold start an AdminGrant's `Date` fields
// are rehydrated as ISO strings. AdminRow formats those fields; before the fix
// it called `.toLocaleDateString()` / `.getTime()` on a string, which threw
// mid-render and crashed the whole portal through the root ErrorBoundary.
import { afterEach, describe, it, expect } from 'vitest';
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { ThemeProvider } from '@kc/ui';
import type { AdminGrant } from '@kc/domain';
import { AdminRow } from '../AdminRow';

afterEach(cleanup);

function withTheme(ui: React.ReactElement) {
  return render(
    <ThemeProvider mode="light" systemScheme="light" setMode={() => {}}>
      {ui}
    </ThemeProvider>,
  );
}

// Shape produced by rehydrating a persisted query: dates are ISO strings, not
// Date instances. Typed as AdminGrant to mirror what the component receives at
// runtime after JSON round-tripping.
const rehydratedGrant = {
  grantId: 'g1',
  userId: 'u1',
  displayName: 'דנה כהן',
  avatarUrl: null,
  role: 'moderator',
  grantedAt: '2026-01-15T10:00:00.000Z',
  grantedBy: 'u0',
  grantedByDisplayName: 'מנהל-על',
  revokedAt: null,
  revokedBy: null,
  lastSeenAt: '2026-06-14T09:00:00.000Z',
} as unknown as AdminGrant;

describe('AdminRow', () => {
  it('renders without crashing when Date fields arrive as ISO strings (rehydrated cache)', () => {
    const { getByText } = withTheme(
      <AdminRow grant={rehydratedGrant} canRevoke={false} onRevoke={() => {}} />,
    );
    expect(getByText('דנה כהן')).toBeTruthy();
  });

  it('renders a revoked grant whose revokedAt is a rehydrated ISO string', () => {
    const revoked = {
      ...rehydratedGrant,
      grantId: 'g2',
      revokedAt: '2026-03-01T12:00:00.000Z',
    } as unknown as AdminGrant;
    const { getByText } = withTheme(
      <AdminRow grant={revoked} canRevoke onRevoke={() => {}} />,
    );
    expect(getByText('דנה כהן')).toBeTruthy();
  });

  it('still renders real Date instances (live, un-cached query result)', () => {
    const live: AdminGrant = {
      grantId: 'g3',
      userId: 'u2',
      displayName: 'אבי לוי',
      avatarUrl: null,
      role: 'support',
      grantedAt: new Date('2026-01-15T10:00:00.000Z'),
      grantedBy: null,
      grantedByDisplayName: null,
      revokedAt: null,
      revokedBy: null,
      lastSeenAt: null,
    };
    const { getByText } = withTheme(
      <AdminRow grant={live} canRevoke={false} onRevoke={() => {}} />,
    );
    expect(getByText('אבי לוי')).toBeTruthy();
  });
});
