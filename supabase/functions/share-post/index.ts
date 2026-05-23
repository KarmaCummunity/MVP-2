// Edge Function: share-post
// FR-POST-023 (BACKLOG P2.33).
//
// GET /share-post/<post_id>
//
// Behaviour:
//   - Crawlers (WhatsApp, Twitter, FB, Telegram, Slack, LinkedIn, Discord,
//     Apple, Google, Bing) get 200 OK with an HTML body whose <head> carries
//     Open Graph + Twitter Card meta tags. The og:image is the post's first
//     image (`media_assets[0].path`) served from the public `post-images`
//     bucket so previews work without an auth header.
//   - Humans (any non-bot UA) get a 302 redirect to
//     https://karma-community-kc.com/post/<post_id> — the deep link
//     already claimed in AASA / assetlinks (TD-66). The AuthGate captures
//     /post/<id> and routes unauth users through sign-in, then back to the
//     post (FR-POST-023 AC6).
//
// Visibility gate:
//   Only `posts.visibility = 'Public'` AND `posts.status = 'open'` posts
//   reveal their title / image. Anything else returns a generic OG card
//   pointing at the marketing landing — never the post's image or title.
//
// Notes:
//   - Service-role client bypasses RLS. We re-check visibility + status in
//     the SELECT filter (defense in depth: any future RLS change cannot
//     accidentally leak through this surface).
//   - No CORS — the URL is opened by social-app fetchers + browser navigations,
//     never by the mobile app at runtime.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STORAGE_BUCKET = 'post-images';
const APP_BASE_URL = Deno.env.get('SHARE_POST_APP_BASE_URL') ?? 'https://karma-community-kc.com';
const APP_NAME = 'KC - קהילת קארמה';
const APP_TAGLINE = 'קהילת קארמה — נותנים ומבקשים מבלי לקנות.';
const FALLBACK_OG_IMAGE =
  Deno.env.get('SHARE_POST_FALLBACK_IMAGE') ?? `${APP_BASE_URL}/og-card.png`;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const BOT_UA = /facebookexternalhit|WhatsApp|Twitterbot|TelegramBot|Slackbot|LinkedInBot|SkypeUriPreview|Discordbot|Applebot|googlebot|bingbot|Pinterest|redditbot|Embedly|vkShare|outbrain|quora|nuzzel|W3C_Validator/i;

interface SharePostShape {
  post_id: string;
  title: string;
  description: string | null;
  visibility: string;
  status: string;
  first_media_path: string | null;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max - 1).trimEnd()}…`;
}

function isPostIdShape(id: string): boolean {
  // Supabase UUID v4. Anything else is rejected before we hit the DB.
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
}

function publicMediaUrl(path: string): string {
  // We could call `supabase.storage.from(...).getPublicUrl()` but the URL
  // shape is stable and we want zero extra latency in the OG render path.
  const trimmed = path.startsWith('/') ? path.slice(1) : path;
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${trimmed}`;
}

async function fetchPostForShare(postId: string): Promise<SharePostShape | null> {
  if (!isPostIdShape(postId)) return null;
  const { data, error } = await supabase
    .from('posts')
    .select('post_id, title, description, visibility, status, media_assets(path, ordinal)')
    .eq('post_id', postId)
    .eq('visibility', 'Public')
    .eq('status', 'open')
    .maybeSingle();
  if (error || !data) return null;
  const media = Array.isArray(data.media_assets) ? data.media_assets : [];
  const first = media
    .slice()
    .sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0))[0];
  return {
    post_id: data.post_id,
    title: data.title,
    description: data.description,
    visibility: data.visibility,
    status: data.status,
    first_media_path: first?.path ?? null,
  };
}

function renderOgHtml(opts: {
  title: string;
  description: string;
  imageUrl: string;
  canonicalUrl: string;
  deepLinkUrl: string;
}): string {
  const { title, description, imageUrl, canonicalUrl, deepLinkUrl } = opts;
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = escapeHtml(imageUrl);
  const safeCanonical = escapeHtml(canonicalUrl);
  const safeDeepLink = escapeHtml(deepLinkUrl);
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safeTitle}</title>
<meta name="description" content="${safeDescription}" />
<link rel="canonical" href="${safeCanonical}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="${escapeHtml(APP_NAME)}" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDescription}" />
<meta property="og:image" content="${safeImage}" />
<meta property="og:image:alt" content="${safeTitle}" />
<meta property="og:url" content="${safeCanonical}" />
<meta property="og:locale" content="he_IL" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDescription}" />
<meta name="twitter:image" content="${safeImage}" />
<meta http-equiv="refresh" content="0;url=${safeDeepLink}" />
</head>
<body>
<noscript><a href="${safeDeepLink}">${safeTitle}</a></noscript>
<script>window.location.replace(${JSON.stringify(deepLinkUrl)});</script>
</body>
</html>`;
}

function renderGenericOgHtml(deepLinkUrl: string): string {
  return renderOgHtml({
    title: APP_NAME,
    description: APP_TAGLINE,
    imageUrl: FALLBACK_OG_IMAGE,
    canonicalUrl: deepLinkUrl,
    deepLinkUrl: APP_BASE_URL,
  });
}

function htmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Bots are fine with a short cache; humans never see this body.
      'cache-control': 'public, max-age=120, s-maxage=120',
      // Defense in depth — never let a malicious post body break out of <head>.
      'x-content-type-options': 'nosniff',
    },
  });
}

function redirectResponse(url: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      location: url,
      'cache-control': 'no-store',
    },
  });
}

function parsePostId(url: URL): string | null {
  // Edge functions are mounted under `/share-post`; the post id is the next
  // segment, optionally with a trailing slash.
  const segments = url.pathname.split('/').filter((s) => s !== '');
  // segments looks like ['share-post', '<id>'] or [<id>] depending on the
  // function mount config. Accept either form.
  const last = segments[segments.length - 1];
  if (!last || last === 'share-post') return null;
  return last;
}

serve(async (req) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('method not allowed', { status: 405 });
  }
  const url = new URL(req.url);
  const postId = parsePostId(url);
  const ua = req.headers.get('user-agent') ?? '';
  const isBot = BOT_UA.test(ua);
  const deepLinkUrl = postId
    ? `${APP_BASE_URL}/post/${encodeURIComponent(postId)}`
    : APP_BASE_URL;

  if (!postId) {
    return isBot ? htmlResponse(renderGenericOgHtml(deepLinkUrl), 404) : redirectResponse(APP_BASE_URL);
  }

  // Humans never read the OG body — bounce them straight to the app deep link.
  // This is the fast path; we do not hit the DB for a human navigation.
  if (!isBot) {
    return redirectResponse(deepLinkUrl);
  }

  let post: SharePostShape | null = null;
  try {
    post = await fetchPostForShare(postId);
  } catch (_err) {
    // Database hiccup — fall through to the generic card so the bot still
    // gets a sane preview while we lose visibility on the failure.
  }

  if (!post) {
    return htmlResponse(renderGenericOgHtml(deepLinkUrl), 200);
  }

  const imageUrl = post.first_media_path ? publicMediaUrl(post.first_media_path) : FALLBACK_OG_IMAGE;
  const description = truncate(post.description?.trim() || APP_TAGLINE, 200);
  return htmlResponse(
    renderOgHtml({
      title: truncate(post.title, 70),
      description,
      imageUrl,
      canonicalUrl: deepLinkUrl,
      deepLinkUrl,
    }),
    200,
  );
});
