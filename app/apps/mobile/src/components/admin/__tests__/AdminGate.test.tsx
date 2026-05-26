// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { Text } from 'react-native';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../hooks/useAdminRoles', () => ({ useAdminRoles: vi.fn() }));
vi.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => <Text>REDIRECT:{href}</Text>,
}));

import { AdminGate } from '../AdminGate';
import { useAdminRoles } from '../../../hooks/useAdminRoles';

describe('AdminGate', () => {
  // Vitest config sets `globals: false`, so @testing-library/react's
  // automatic cleanup is not wired. Call it explicitly to prevent DOM
  // bleed between tests.
  afterEach(() => {
    cleanup();
  });

  it('renders children when the user has any admin role', () => {
    (useAdminRoles as unknown as ReturnType<typeof vi.fn>).mockReturnValue(['support']);
    render(
      <AdminGate>
        <Text>inside</Text>
      </AdminGate>,
    );
    expect(screen.queryByText('inside')).toBeTruthy();
  });

  it('redirects when the user has no admin role', () => {
    (useAdminRoles as unknown as ReturnType<typeof vi.fn>).mockReturnValue([]);
    render(
      <AdminGate>
        <Text>inside</Text>
      </AdminGate>,
    );
    expect(screen.queryByText('inside')).toBeNull();
    expect(screen.queryByText(/REDIRECT:/)).toBeTruthy();
  });
});
