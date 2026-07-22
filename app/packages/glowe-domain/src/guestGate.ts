// FR-GLOWE-023 — Guest peek + contextual join copy (pure domain).

export type GuestAction =
  | 'create-need'
  | 'create-post'
  | 'create-opportunity'
  | 'create-thread'
  | 'create-reply'
  | 'apply-opportunity'
  | 'rsvp-event'
  | 'offer-help'
  | 'save-item'
  | 'send-message'
  | 'follow-profile'
  | 'report-content'
  | 'open-personal-area';

export interface GuestJoinCopy {
  readonly title: string;
  readonly body: string;
}

export interface GuestJoinContext {
  org?: string;
  title?: string;
}

export const GUEST_JOIN_COPY: Record<GuestAction, GuestJoinCopy> = {
  'create-need': {
    title: 'Sign in to post a need',
    body: 'Browsing GloWe is open to everyone. Sign in with Google to post a need and reach people ready to help.',
  },
  'create-post': {
    title: 'Sign in to post',
    body: 'Sign in with Google to share a post with the GloWe community.',
  },
  'create-opportunity': {
    title: 'Sign in to publish',
    body: 'Sign in with Google to publish this opportunity and start receiving applications.',
  },
  'create-thread': {
    title: 'Sign in to start a discussion',
    body: 'Sign in with Google to open a new discussion thread.',
  },
  'create-reply': {
    title: 'Sign in to reply',
    body: 'Sign in with Google to join this discussion.',
  },
  'apply-opportunity': {
    title: 'Sign in to apply',
    body: 'Sign in with Google to apply to {org} and track your application.',
  },
  'rsvp-event': {
    title: 'Save your spot',
    body: 'Sign in with Google to register for {title}.',
  },
  'offer-help': {
    title: 'Ready to lend a hand?',
    body: 'Sign in with Google to reach {org} and offer your help.',
  },
  'save-item': {
    title: 'Keep this for later',
    body: 'Sign in with Google to save it to your list.',
  },
  'send-message': {
    title: 'Start the conversation',
    body: 'Sign in with Google to message {org}.',
  },
  'follow-profile': {
    title: 'Sign in to follow',
    body: 'Sign in with Google to follow profiles and stay updated on their work.',
  },
  'report-content': {
    title: 'Sign in to report',
    body: 'Sign in with Google to report this content so our team can review it.',
  },
  'open-personal-area': {
    title: 'Sign in to continue',
    body: 'Sign in with Google to open your personal area.',
  },
};

export const GENERIC_GUEST_COPY: GuestJoinCopy = {
  title: 'Sign in to continue',
  body: 'Sign in with Google to do this on GloWe.',
};

function interpolate(text: string, ctx: GuestJoinContext | null | undefined): string {
  const c = ctx ?? {};
  return text
    .replace(/\{org\}/g, c.org ? c.org : '')
    .replace(/\{title\}/g, c.title ? c.title : '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+\./g, '.')
    .trim();
}

export function buildJoinCopy(
  actionKey: string,
  ctx?: GuestJoinContext | null,
): GuestJoinCopy {
  const tpl =
    (GUEST_JOIN_COPY as Record<string, GuestJoinCopy>)[actionKey] ??
    GENERIC_GUEST_COPY;
  return {
    title: interpolate(tpl.title, ctx),
    body: interpolate(tpl.body, ctx),
  };
}
