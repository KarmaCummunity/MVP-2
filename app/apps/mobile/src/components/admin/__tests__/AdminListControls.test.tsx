// @vitest-environment jsdom
// FR-RESP-006 / FR-ADMIN-011 — the shared admin search + filter/sort band
// renders each screen's search field, chip groups, and total label so every
// sub-screen stays consistent and phone-friendly.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdminListControls } from '../AdminListControls';

describe('AdminListControls', () => {
  afterEach(cleanup);

  it('renders search placeholder, chip groups and total label', () => {
    render(
      <AdminListControls
        search={{ value: '', onChangeText: () => {}, placeholder: 'search-here' }}
        filterGroups={[{
          key: 'status',
          options: [
            { key: 'all', label: 'all-chip', active: true, onPress: () => {} },
            { key: 'open', label: 'open-chip', active: false, onPress: () => {} },
          ],
        }]}
        totalLabel="12 results"
      />,
    );
    expect(screen.queryByPlaceholderText('search-here')).toBeTruthy();
    expect(screen.queryByText('all-chip')).toBeTruthy();
    expect(screen.queryByText('open-chip')).toBeTruthy();
    expect(screen.queryByText('12 results')).toBeTruthy();
  });

  it('fires a chip onPress when tapped', () => {
    const onPress = vi.fn();
    render(
      <AdminListControls
        filterGroups={[{
          key: 'status',
          options: [{ key: 'open', label: 'open-chip', active: false, onPress }],
        }]}
      />,
    );
    fireEvent.click(screen.getByText('open-chip'));
    expect(onPress).toHaveBeenCalledOnce();
  });
});
