import { describe, it, expect } from 'vitest';
import type { SearchFilters } from '@kc/domain';
import { UniversalSearchUseCase } from '../UniversalSearchUseCase';
import type {
  ISearchRepository,
  UniversalSearchResults,
} from '../../ports/ISearchRepository';

interface SearchCall {
  query: string;
  filters: SearchFilters;
  viewerId: string | null;
  limits: { posts: number; users: number; links: number };
}

class StubSearchRepo implements ISearchRepository {
  calls: SearchCall[] = [];
  toReturn: UniversalSearchResults = {
    posts: [],
    users: [],
    links: [],
    totalCount: 0,
  };

  async search(
    query: string,
    filters: SearchFilters,
    viewerId: string | null,
    limits: { posts: number; users: number; links: number },
  ): Promise<UniversalSearchResults> {
    this.calls.push({ query, filters, viewerId, limits });
    return this.toReturn;
  }
}

const EMPTY_FILTERS: SearchFilters = {};

describe('UniversalSearchUseCase', () => {
  describe('query length gating', () => {
    it('returns empty without calling the repo for a single-character query', async () => {
      const repo = new StubSearchRepo();
      const uc = new UniversalSearchUseCase(repo);

      const result = await uc.execute({
        query: 'a',
        filters: EMPTY_FILTERS,
        viewerId: 'u1',
      });

      expect(repo.calls).toHaveLength(0);
      expect(result).toEqual({ posts: [], users: [], links: [], totalCount: 0 });
    });

    it('treats whitespace-only query as a single char after trim and returns empty', async () => {
      const repo = new StubSearchRepo();
      const uc = new UniversalSearchUseCase(repo);

      const result = await uc.execute({
        query: '  a  ',
        filters: EMPTY_FILTERS,
        viewerId: null,
      });

      expect(repo.calls).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('calls the repo with the empty string for an empty query (explore mode)', async () => {
      const repo = new StubSearchRepo();
      const uc = new UniversalSearchUseCase(repo);

      await uc.execute({ query: '', filters: EMPTY_FILTERS, viewerId: 'u1' });

      expect(repo.calls).toHaveLength(1);
      expect(repo.calls[0]!.query).toBe('');
    });

    it('treats a whitespace-only query as explore mode (trimmed to empty)', async () => {
      const repo = new StubSearchRepo();
      const uc = new UniversalSearchUseCase(repo);

      await uc.execute({ query: '   ', filters: EMPTY_FILTERS, viewerId: 'u1' });

      expect(repo.calls).toHaveLength(1);
      expect(repo.calls[0]!.query).toBe('');
    });

    it('forwards a >= 2-char query (trimmed) to the repo', async () => {
      const repo = new StubSearchRepo();
      const uc = new UniversalSearchUseCase(repo);

      await uc.execute({ query: '  car  ', filters: EMPTY_FILTERS, viewerId: 'u1' });

      expect(repo.calls).toHaveLength(1);
      expect(repo.calls[0]!.query).toBe('car');
    });
  });

  describe('viewerId forwarding', () => {
    it('forwards a non-null viewerId verbatim', async () => {
      const repo = new StubSearchRepo();
      const uc = new UniversalSearchUseCase(repo);

      await uc.execute({ query: 'car', filters: EMPTY_FILTERS, viewerId: 'u_viewer' });

      expect(repo.calls[0]!.viewerId).toBe('u_viewer');
    });

    it('forwards a null viewerId (guest preview) verbatim', async () => {
      const repo = new StubSearchRepo();
      const uc = new UniversalSearchUseCase(repo);

      await uc.execute({ query: 'car', filters: EMPTY_FILTERS, viewerId: null });

      expect(repo.calls[0]!.viewerId).toBeNull();
    });
  });

  describe('limits clamping', () => {
    it('applies the default limit of 10 per domain when limits is omitted', async () => {
      const repo = new StubSearchRepo();
      const uc = new UniversalSearchUseCase(repo);

      await uc.execute({ query: 'car', filters: EMPTY_FILTERS, viewerId: null });

      expect(repo.calls[0]!.limits).toEqual({ posts: 10, users: 10, links: 10 });
    });

    it('clamps values above 50 down to the HARD_MAX of 50', async () => {
      const repo = new StubSearchRepo();
      const uc = new UniversalSearchUseCase(repo);

      await uc.execute({
        query: 'car',
        filters: EMPTY_FILTERS,
        viewerId: null,
        limits: { posts: 999, users: 200, links: 51 },
      });

      expect(repo.calls[0]!.limits).toEqual({ posts: 50, users: 50, links: 50 });
    });

    it('clamps values below 1 up to the lower bound of 1', async () => {
      const repo = new StubSearchRepo();
      const uc = new UniversalSearchUseCase(repo);

      await uc.execute({
        query: 'car',
        filters: EMPTY_FILTERS,
        viewerId: null,
        limits: { posts: 0, users: -5, links: -100 },
      });

      expect(repo.calls[0]!.limits).toEqual({ posts: 1, users: 1, links: 1 });
    });

    it('truncates fractional limit values', async () => {
      const repo = new StubSearchRepo();
      const uc = new UniversalSearchUseCase(repo);

      await uc.execute({
        query: 'car',
        filters: EMPTY_FILTERS,
        viewerId: null,
        limits: { posts: 7.9, users: 3.2, links: 12.999 },
      });

      expect(repo.calls[0]!.limits).toEqual({ posts: 7, users: 3, links: 12 });
    });

    it('mixes overrides with defaults when only some limits are supplied', async () => {
      const repo = new StubSearchRepo();
      const uc = new UniversalSearchUseCase(repo);

      await uc.execute({
        query: 'car',
        filters: EMPTY_FILTERS,
        viewerId: null,
        limits: { posts: 25 },
      });

      expect(repo.calls[0]!.limits).toEqual({ posts: 25, users: 10, links: 10 });
    });
  });

  describe('filter normalization', () => {
    it('coerces an empty filter bag into the canonical defaults', async () => {
      const repo = new StubSearchRepo();
      const uc = new UniversalSearchUseCase(repo);

      await uc.execute({ query: 'car', filters: {}, viewerId: null });

      expect(repo.calls[0]!.filters).toEqual({
        resultType: null,
        postType: null,
        category: null,
        donationCategory: null,
        city: null,
        sortBy: 'relevance',
        minFollowers: null,
      });
    });

    it('preserves caller-supplied non-null filter values', async () => {
      const repo = new StubSearchRepo();
      const uc = new UniversalSearchUseCase(repo);

      await uc.execute({
        query: 'car',
        filters: {
          resultType: 'post',
          postType: 'Give',
          category: 'Electronics',
          donationCategory: 'food',
          city: 'tel-aviv',
          sortBy: 'newest',
          minFollowers: 50,
        },
        viewerId: null,
      });

      expect(repo.calls[0]!.filters).toEqual({
        resultType: 'post',
        postType: 'Give',
        category: 'Electronics',
        donationCategory: 'food',
        city: 'tel-aviv',
        sortBy: 'newest',
        minFollowers: 50,
      });
    });

    it('normalizes negative minFollowers to null', async () => {
      const repo = new StubSearchRepo();
      const uc = new UniversalSearchUseCase(repo);

      await uc.execute({
        query: 'car',
        filters: { minFollowers: -1 },
        viewerId: null,
      });

      expect(repo.calls[0]!.filters.minFollowers).toBeNull();
    });

    it('keeps minFollowers === 0 as null (falsy)', async () => {
      const repo = new StubSearchRepo();
      const uc = new UniversalSearchUseCase(repo);

      await uc.execute({
        query: 'car',
        filters: { minFollowers: 0 },
        viewerId: null,
      });

      // Implementation treats falsy minFollowers (incl. 0) as null —
      // this matches the FR-FEED-018 intent that a 0-follower filter is
      // semantically "no filter".
      expect(repo.calls[0]!.filters.minFollowers).toBeNull();
    });
  });

  describe('result pass-through', () => {
    it('returns whatever the repository returns', async () => {
      const repo = new StubSearchRepo();
      const expected: UniversalSearchResults = {
        posts: [],
        users: [
          {
            userId: 'u1',
            displayName: 'Test',
            shareHandle: 'test',
            avatarUrl: null,
            biography: null,
            city: 'tel-aviv',
            cityName: 'Tel Aviv',
            followersCount: 5,
            itemsGivenCount: 2,
          },
        ],
        links: [],
        totalCount: 1,
      };
      repo.toReturn = expected;
      const uc = new UniversalSearchUseCase(repo);

      const result = await uc.execute({
        query: 'test',
        filters: EMPTY_FILTERS,
        viewerId: null,
      });

      expect(result).toBe(expected);
    });
  });
});
