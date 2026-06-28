import { describe, expect, it } from 'vitest';
import { ChronologicalRideMatchScorer } from '../ChronologicalRideMatchScorer';

describe('ChronologicalRideMatchScorer', () => {
  const scorer = new ChronologicalRideMatchScorer();

  it('sorts rows ascending by departsAt', () => {
    const rows = [
      { id: 'c', departsAt: '2026-06-03T08:00:00Z' },
      { id: 'a', departsAt: '2026-06-01T08:00:00Z' },
      { id: 'b', departsAt: '2026-06-02T08:00:00Z' },
    ];

    const out = scorer.sort(rows);

    expect(out.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the input array', () => {
    const rows = [
      { id: 'b', departsAt: '2026-06-02T08:00:00Z' },
      { id: 'a', departsAt: '2026-06-01T08:00:00Z' },
    ];
    const snapshot = rows.map((r) => r.id);

    scorer.sort(rows);

    expect(rows.map((r) => r.id)).toEqual(snapshot);
  });

  it('returns an empty array unchanged', () => {
    expect(scorer.sort([])).toEqual([]);
  });

  it('keeps stable ordering for equal departsAt timestamps', () => {
    const rows = [
      { id: 'a', departsAt: '2026-06-01T08:00:00Z' },
      { id: 'b', departsAt: '2026-06-01T08:00:00Z' },
      { id: 'c', departsAt: '2026-06-01T08:00:00Z' },
    ];

    const out = scorer.sort(rows);

    expect(out.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });
});
