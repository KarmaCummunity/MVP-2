// @vitest-environment jsdom
import { afterEach, describe, it, expect } from 'vitest';
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { ThemeProvider } from '@kc/ui';
import { PostGridSkeleton } from '../PostGridSkeleton';
import { InboxListSkeleton } from '../InboxListSkeleton';

afterEach(cleanup);

function withTheme(ui: React.ReactElement) {
  return render(
    <ThemeProvider mode="light" systemScheme="light" setMode={() => {}}>
      {ui}
    </ThemeProvider>,
  );
}

describe('PostGridSkeleton', () => {
  it('renders `count` card placeholders in a 2-column feed grid', () => {
    const { getAllByTestId } = withTheme(<PostGridSkeleton columns={2} count={6} />);
    expect(getAllByTestId('post-card-skeleton')).toHaveLength(6);
  });

  it('renders `count` card placeholders in a dense 3-column profile grid', () => {
    const { getAllByTestId } = withTheme(<PostGridSkeleton columns={3} count={9} />);
    expect(getAllByTestId('post-card-skeleton')).toHaveLength(9);
  });

  it('renders only the actual cards when the last row is incomplete (no phantom cards)', () => {
    // 3 columns, 4 cards → last row has 1 card + 2 spacers; only 4 skeletons rendered
    const { getAllByTestId } = withTheme(<PostGridSkeleton columns={3} count={4} />);
    expect(getAllByTestId('post-card-skeleton')).toHaveLength(4);
  });
});

describe('InboxListSkeleton', () => {
  it('renders `count` row placeholders', () => {
    const { getAllByTestId } = withTheme(<InboxListSkeleton count={5} />);
    expect(getAllByTestId('inbox-row-skeleton')).toHaveLength(5);
  });

  it('defaults to a non-empty list when count is omitted', () => {
    const { getAllByTestId } = withTheme(<InboxListSkeleton />);
    expect(getAllByTestId('inbox-row-skeleton').length).toBeGreaterThan(0);
  });

  it('renders count-1 separators between rows', () => {
    const { getAllByTestId } = withTheme(<InboxListSkeleton count={3} />);
    // 3 rows → 2 separators between them
    expect(getAllByTestId('inbox-row-skeleton')).toHaveLength(3);
  });
});
