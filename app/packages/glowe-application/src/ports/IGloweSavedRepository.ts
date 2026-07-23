// FR-GLOWE-013 — per-user saved items (backend.js saved_items table).

export type GloweSavedItemType =
  | 'opportunity'
  | 'post'
  | 'wish'
  | 'event'
  | 'profile'
  | string;

export interface GloweSavedItemRow {
  readonly id: string;
  readonly user_id?: string;
  readonly item_type: GloweSavedItemType;
  readonly item_id: string;
  readonly title: string;
  readonly meta: string;
  readonly href: string;
  readonly created_at?: string;
}

export interface CreateSavedItemInput {
  readonly item_type?: string;
  readonly itemType?: string;
  readonly item_id?: string;
  readonly itemId?: string;
  readonly title?: string;
  readonly meta?: string;
  readonly href?: string;
}

export interface RemoveSavedItemFilters {
  readonly id?: string;
  readonly item_type?: string;
  readonly item_id?: string;
}

export interface IGloweSavedRepository {
  listMine(): Promise<readonly GloweSavedItemRow[] | null>;
  save(payload: CreateSavedItemInput): Promise<GloweSavedItemRow | null>;
  remove(filters: RemoveSavedItemFilters): Promise<boolean | null>;
}
