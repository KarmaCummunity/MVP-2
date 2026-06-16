// @vitest-environment jsdom
// FR-RESP-006 — guards the responsive invariant for admin filter rows: the
// shared horizontal scroller renders every chip it is handed so sub-screens
// can drop their ad-hoc ScrollView wrappers that collapsed on mobile-web.
import { cleanup, render, screen } from '@testing-library/react';
import { Text } from 'react-native';
import { afterEach, describe, expect, it } from 'vitest';

import { AdminFilterChipRow } from '../AdminFilterChipRow';

describe('AdminFilterChipRow', () => {
  afterEach(cleanup);

  it('renders its chip children', () => {
    render(
      <AdminFilterChipRow>
        <Text>chip-a</Text>
        <Text>chip-b</Text>
      </AdminFilterChipRow>,
    );
    expect(screen.queryByText('chip-a')).toBeTruthy();
    expect(screen.queryByText('chip-b')).toBeTruthy();
  });
});
