// supabase/functions/_shared/translation/googlefree.ts
// Keyless, no-billing translation via Google's public `translate_a/single`
// endpoint (the same one the web widget uses). Chosen because the free Gemini
// tier is not universally available — some projects/regions return
// `free_tier_requests limit: 0` (TD-75) — and the PM directive is "free models
// only, no billing". This endpoint needs no API key and auto-detects the source
// language, which the same-language short-circuit in the callers relies on.
// Trade-off: it is an undocumented endpoint (ToS-gray, may change without
// notice); revisit for an official/DPA provider before GA (D-63/D-65, TD-75).
// Shared by the KC `translate` and GLOWE `glowe-translate` Edge Functions.

import type { ProviderInput, ProviderResult, TranslationProvider } from './provider.ts';

const ENDPOINT = 'https://translate.googleapis.com/translate_a/single';
const MODEL = 'google-translate-web';

// Google uses the legacy `iw` tag for Hebrew on this endpoint; normalise a few
// BCP-47 targets to what the endpoint expects. Other supported targets
// (en/ar/ru) map 1:1, so only the base language is forwarded.
const TARGET_ALIASES: Record<string, string> = { he: 'iw' };

function targetCode(tag: string): string {
  const base = tag.toLowerCase().split('-')[0];
  return TARGET_ALIASES[base] ?? base;
}

// Reverse map for the DETECTED source code so the callers' same-language
// short-circuit sees BCP-47 (`he`), not Google's legacy `iw`. Without this,
// Hebrew content targeting `he` would fail the source==target check and get
// pointlessly re-"translated" and cached.
const SOURCE_ALIASES: Record<string, string> = { iw: 'he', jw: 'jv', in: 'id' };

function normaliseSource(code: string): string {
  return SOURCE_ALIASES[code.toLowerCase()] ?? code;
}

// GET query params; the (long) source text goes in the POST body instead so we
// never blow the URL length limit for content up to MAX_INPUT chars.
function buildUrl(input: ProviderInput): string {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'auto',
    tl: targetCode(input.targetLanguage),
    dt: 't',
  });
  return `${ENDPOINT}?${params.toString()}`;
}

// Response shape: [ [ [translatedSeg, sourceSeg, ...], ... ], null, detectedSrc, ... ].
// Long inputs come back as multiple segments that must be concatenated in order.
type Segment = [string, string, ...unknown[]];
function parseResult(raw: string): ProviderResult {
  const outer = JSON.parse(raw) as [Segment[] | null, unknown, string?, ...unknown[]];
  const segments = outer[0];
  if (!Array.isArray(segments)) throw new Error('google-free returned no segments');
  const translated = segments.map((s) => (Array.isArray(s) ? (s[0] ?? '') : '')).join('');
  if (translated.length === 0) throw new Error('google-free returned empty translation');
  const src = typeof outer[2] === 'string' ? normaliseSource(outer[2]) : null;
  return { translatedText: translated, detectedSourceLanguage: src, confidence: null, model: MODEL };
}

// Transient statuses worth one quick retry (rate-limit + upstream blips).
const RETRYABLE = new Set([429, 500, 502, 503]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class GoogleFreeProvider implements TranslationProvider {
  async translate(input: ProviderInput): Promise<ProviderResult> {
    const url = buildUrl(input);
    const body = new URLSearchParams({ q: input.text }).toString();
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (res.ok) return parseResult(await res.text());
      const detail = (await res.text()).slice(0, 300);
      if (RETRYABLE.has(res.status) && attempt === 0) {
        await sleep(600);
        continue;
      }
      throw new Error(`google-free http ${res.status}: ${detail}`);
    }
    throw new Error('google-free exhausted retries');
  }
}
