/**
 * Unit tests for SupabaseSurveyRepository — listActive, getBundle, upsertAnswers.
 * Uses a manually-crafted mock — no live Supabase instance.
 * Integration tests against a local Supabase fixture are deferred
 * (no local-Supabase fixture in CI per existing repo pattern).
 * See SupabaseSurveyRepository.feedback.test.ts for checkPromptEligibility
 * and submitFreeFeedback.
 */
import { describe, it, expect, vi } from 'vitest';
import { SurveyError } from '@kc/domain';
import { SupabaseSurveyRepository } from '../SupabaseSurveyRepository';

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

type RpcOverrides = Record<string, { data: unknown; error: { message: string } | null }>;

export function makeClient(opts: {
  rpcResults?: RpcOverrides;
  insertResult?: { error: { message: string } | null };
  userId?: string | null;
  authError?: { message: string } | null;
} = {}): any {
  const rpcResults = opts.rpcResults ?? {};
  const insertResult = opts.insertResult ?? { error: null };
  const userId = 'userId' in opts ? opts.userId : 'user-uuid';
  const authError = opts.authError ?? null;

  return {
    rpc: vi.fn().mockImplementation((name: string) => {
      const result = rpcResults[name];
      return Promise.resolve(result ?? { data: null, error: null });
    }),
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue(insertResult),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: authError,
      }),
    },
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ACTIVE_SURVEY_ROW = {
  slug: 'ux-experience',
  title_he: 'סקר חווית משתמש',
  description_he: 'תיאור',
  current_version: 1,
  completion_status: 'not_started',
};

const BUNDLE_RAW = {
  slug: 'ux-experience',
  title_he: 'סקר חווית משתמש',
  version: 1,
  questions: [
    {
      id: 'q-001',
      sort_order: 1,
      question_type: 'rating_1_7_with_optional_text',
      short_label_he: 'המלצה',
      prompt_he: 'כמה סביר שתמליץ?',
      context_he: '',
      text_placeholder_he: 'הסבר קצר',
      rating_anchor_low_he: 'לא מספיק',
      rating_anchor_high_he: 'מצוין',
    },
  ],
  answers: [
    { question_id: 'q-001', rating: 5, answer_text: 'בסדר' },
  ],
};

// ---------------------------------------------------------------------------
// listActive
// ---------------------------------------------------------------------------

describe('SupabaseSurveyRepository.listActive', () => {
  it('maps snake_case rows to SurveyListItem[]', async () => {
    const client = makeClient({
      rpcResults: {
        list_active_surveys: { data: [ACTIVE_SURVEY_ROW], error: null },
      },
    });
    const repo = new SupabaseSurveyRepository(client);
    const result = await repo.listActive();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      slug: 'ux-experience',
      titleHe: 'סקר חווית משתמש',
      descriptionHe: 'תיאור',
      currentVersion: 1,
      completionStatus: 'not_started',
    });
    expect(client.rpc).toHaveBeenCalledWith('list_active_surveys');
  });

  it('returns [] when RPC returns null data', async () => {
    const client = makeClient({
      rpcResults: { list_active_surveys: { data: null, error: null } },
    });
    const repo = new SupabaseSurveyRepository(client);
    expect(await repo.listActive()).toEqual([]);
  });

  it('throws SurveyError(network) on RPC error', async () => {
    const client = makeClient({
      rpcResults: { list_active_surveys: { data: null, error: { message: 'timeout' } } },
    });
    const repo = new SupabaseSurveyRepository(client);
    await expect(repo.listActive()).rejects.toBeInstanceOf(SurveyError);
    await expect(repo.listActive()).rejects.toMatchObject({ code: 'network' });
  });
});

// ---------------------------------------------------------------------------
// getBundle
// ---------------------------------------------------------------------------

describe('SupabaseSurveyRepository.getBundle', () => {
  it('maps snake_case JSON including per-question rating anchors', async () => {
    const client = makeClient({
      rpcResults: { get_survey_bundle: { data: BUNDLE_RAW, error: null } },
    });
    const repo = new SupabaseSurveyRepository(client);
    const bundle = await repo.getBundle('ux-experience');

    expect(bundle.slug).toBe('ux-experience');
    expect(bundle.titleHe).toBe('סקר חווית משתמש');
    expect(bundle.version).toBe(1);
    expect(bundle.questions).toHaveLength(1);

    const [q] = bundle.questions;
    expect(q?.id).toBe('q-001');
    expect(q?.sortOrder).toBe(1);
    expect(q?.questionType).toBe('rating_1_7_with_optional_text');
    expect(q?.shortLabelHe).toBe('המלצה');
    expect(q?.ratingAnchorLowHe).toBe('לא מספיק');
    expect(q?.ratingAnchorHighHe).toBe('מצוין');
  });

  it('maps existing answers (question_id → questionId)', async () => {
    const client = makeClient({
      rpcResults: { get_survey_bundle: { data: BUNDLE_RAW, error: null } },
    });
    const repo = new SupabaseSurveyRepository(client);
    const bundle = await repo.getBundle('ux-experience');

    expect(bundle.answers).toHaveLength(1);
    expect(bundle.answers[0]).toEqual({
      questionId: 'q-001',
      rating: 5,
      answerText: 'בסדר',
    });
  });

  it('calls RPC with correct p_slug argument', async () => {
    const client = makeClient({
      rpcResults: { get_survey_bundle: { data: BUNDLE_RAW, error: null } },
    });
    const repo = new SupabaseSurveyRepository(client);
    await repo.getBundle('ux-experience');
    expect(client.rpc).toHaveBeenCalledWith('get_survey_bundle', { p_slug: 'ux-experience' });
  });

  it('throws SurveyError(not_found) when RPC raises survey_not_found', async () => {
    const client = makeClient({
      rpcResults: {
        get_survey_bundle: { data: null, error: { message: 'survey_not_found' } },
      },
    });
    const repo = new SupabaseSurveyRepository(client);
    await expect(repo.getBundle('missing')).rejects.toMatchObject({ code: 'not_found' });
  });
});

// ---------------------------------------------------------------------------
// upsertAnswers
// ---------------------------------------------------------------------------

describe('SupabaseSurveyRepository.upsertAnswers', () => {
  it('calls RPC with the correct p_slug and snake_case p_answers payload', async () => {
    const client = makeClient({
      rpcResults: { upsert_survey_answers: { data: null, error: null } },
    });
    const repo = new SupabaseSurveyRepository(client);
    await repo.upsertAnswers('ux-experience', [
      { questionId: 'q-001', rating: 5, answerText: 'great' },
    ]);

    expect(client.rpc).toHaveBeenCalledWith('upsert_survey_answers', {
      p_slug: 'ux-experience',
      p_answers: [{ question_id: 'q-001', rating: 5, answer_text: 'great' }],
    });
  });

  it('maps null answerText to null in payload', async () => {
    const client = makeClient({
      rpcResults: { upsert_survey_answers: { data: null, error: null } },
    });
    const repo = new SupabaseSurveyRepository(client);
    await repo.upsertAnswers('ux-experience', [
      { questionId: 'q-001', rating: 3, answerText: null },
    ]);
    expect(client.rpc).toHaveBeenCalledWith(
      'upsert_survey_answers',
      expect.objectContaining({
        p_answers: [{ question_id: 'q-001', rating: 3, answer_text: null }],
      }),
    );
  });

  it('throws SurveyError(inactive) for survey_not_found_or_inactive', async () => {
    const client = makeClient({
      rpcResults: {
        upsert_survey_answers: {
          data: null,
          error: { message: 'survey_not_found_or_inactive' },
        },
      },
    });
    const repo = new SupabaseSurveyRepository(client);
    await expect(
      repo.upsertAnswers('ux-experience', []),
    ).rejects.toMatchObject({ code: 'inactive' });
  });

  it('throws SurveyError(validation) for invalid_rating errors', async () => {
    const client = makeClient({
      rpcResults: {
        upsert_survey_answers: {
          data: null,
          error: { message: 'invalid_rating for question q-001' },
        },
      },
    });
    const repo = new SupabaseSurveyRepository(client);
    await expect(
      repo.upsertAnswers('ux-experience', [{ questionId: 'q-001', rating: 0, answerText: null }]),
    ).rejects.toMatchObject({ code: 'validation' });
  });
});
