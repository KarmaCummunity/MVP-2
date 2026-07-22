import {
  filterWishes,
  isOpenWish,
  mapWishRow,
  type WishFilters,
  type WishRow,
  type WishViewModel,
} from '@kc/glowe-domain';

import type { GloweListOrder } from '../ports/GloweListOrder';
import type {
  GlowePostRow,
  IGlowePostRepository,
} from '../ports/IGlowePostRepository';

function asWishRow(row: GlowePostRow): WishRow {
  return row as WishRow;
}

export function mapOpenWishRows(
  rows: readonly GlowePostRow[] | null | undefined,
): readonly WishViewModel[] {
  return (rows ?? [])
    .filter((row) => isOpenWish(asWishRow(row)))
    .map((row) => mapWishRow(asWishRow(row)));
}

export interface ListWishesDeps {
  readonly posts: IGlowePostRepository;
}

export interface ListWishesInput {
  readonly order?: GloweListOrder;
  readonly filters?: WishFilters;
}

export async function listWishes(
  deps: ListWishesDeps,
  input: ListWishesInput = {},
): Promise<readonly WishViewModel[]> {
  const rows = await deps.posts.listAll(input.order);
  const mapped = mapOpenWishRows(rows ?? []);
  if (!input.filters) return mapped;
  return filterWishes(mapped, input.filters);
}
