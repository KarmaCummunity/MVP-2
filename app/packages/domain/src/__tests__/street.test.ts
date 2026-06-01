import { describe, it, expectTypeOf } from 'vitest';
import type { Street } from '../entities';

describe('Street entity', () => {
  it('has the canonical shape used by the picker contract', () => {
    expectTypeOf<Street>().toEqualTypeOf<{
      readonly cityId: string;
      readonly streetId: number;
      readonly nameHe: string;
    }>();
  });

  it('uses string for cityId so it matches `cities.city_id` (text column)', () => {
    expectTypeOf<Street['cityId']>().toEqualTypeOf<string>();
  });

  it('uses number for streetId because the source is a smallint code', () => {
    expectTypeOf<Street['streetId']>().toEqualTypeOf<number>();
  });
});
