// FR-GLOWE-005 / FR-GLOWE-006 — community posts & wishes (backend.js posts block).

import type { GloweListOrder } from './GloweListOrder';

export type GlowePostType = 'community' | string;

export type GlowePostStatus = 'open' | 'closed' | 'removed' | string;

export interface GlowePostRow {
  readonly id: string;
  readonly user_id?: string;
  readonly title: string;
  readonly category: string;
  readonly text: string;
  readonly tags: readonly string[];
  readonly audience: string;
  readonly language: string;
  readonly link: string;
  readonly author_name: string;
  readonly author_name_en: string | null;
  readonly post_type: GlowePostType;
  readonly wish_type: string | null;
  readonly impact_area: string | null;
  readonly status: GlowePostStatus;
  readonly created_at?: string;
}

export interface CreatePostInput {
  readonly title?: string;
  readonly category?: string;
  readonly text?: string;
  readonly content?: string;
  readonly tags?: readonly string[];
  readonly audience?: string;
  readonly language?: string;
  readonly link?: string;
  readonly authorName?: string;
  readonly author_name?: string;
  readonly authorNameEn?: string | null;
  readonly author_name_en?: string | null;
  readonly post_type?: GlowePostType;
  readonly wish_type?: string | null;
  readonly impact_area?: string | null;
  readonly status?: GlowePostStatus;
}

export interface GloweOfferRow {
  readonly id: string;
  readonly post_id: string;
  readonly offer_text: string;
  readonly availability: string;
  readonly contact_preference: string;
  readonly user_id?: string;
  readonly created_at?: string;
  readonly offerer_name?: string;
  readonly offerer_avatar?: string;
  readonly offerer_email?: string;
}

export interface CreateOfferInput {
  readonly postId?: string;
  readonly post_id?: string;
  readonly offerText?: string;
  readonly offer_text?: string;
  readonly availability?: string;
  readonly contactPreference?: string;
  readonly contact_preference?: string;
}

export interface IGlowePostRepository {
  listAll(options?: GloweListOrder): Promise<readonly GlowePostRow[] | null>;
  listMine(): Promise<readonly GlowePostRow[] | null>;
  insert(payload: CreatePostInput): Promise<GlowePostRow | null>;
  update(id: string, patch: Partial<CreatePostInput>): Promise<GlowePostRow | null>;
  remove(filters: Record<string, string | number>): Promise<boolean | null>;
  listOffersForPost(postId: string): Promise<readonly GloweOfferRow[]>;
  insertOffer(payload: CreateOfferInput): Promise<GloweOfferRow | null>;
}
