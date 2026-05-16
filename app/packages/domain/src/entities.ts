// ─────────────────────────────────────────────
// ENTITIES — Karma Community Domain Layer
// Mapped to SRS Part III § 3.2
// ─────────────────────────────────────────────

import type {
  AccountStatus,
  AuthProvider,
  FollowRequestStatus,
  MessageKind,
  MessageStatus,
  NotificationPreferences,
  OnboardingState,
  Platform,
  PrivacyMode,
  QueueReason,
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from './value-objects';

// ── User ──────────────────────────────────────

export interface User {
  readonly userId: string;
  readonly authProvider: AuthProvider;
  readonly shareHandle: string;
  displayName: string;
  city: string;
  cityName: string;
  /** Optional home address line on profile; null = city-only (FR-PROFILE-007). */
  profileStreet: string | null;
  profileStreetNumber: string | null;
  biography: string | null;
  avatarUrl: string | null;
  privacyMode: PrivacyMode;
  privacyChangedAt: string | null;
  accountStatus: AccountStatus;
  onboardingState: OnboardingState;
  notificationPreferences: NotificationPreferences;
  isSuperAdmin: boolean;
  closureExplainerDismissed: boolean;
  firstPostNudgeDismissed: boolean;
  // Counters (derived, maintained by domain events)
  itemsGivenCount: number;
  itemsReceivedCount: number;
  activePostsCountInternal: number;
  followersCount: number;
  followingCount: number;
  readonly createdAt: string;
  updatedAt: string;
}

// ── AuthIdentity ──────────────────────────────

export interface AuthIdentity {
  readonly authIdentityId: string;
  readonly userId: string;
  readonly provider: AuthProvider;
  readonly providerSubject: string;
  readonly createdAt: string;
}

// ── Device ───────────────────────────────────

export interface Device {
  readonly deviceId: string;
  readonly userId: string;
  readonly platform: Platform;
  pushToken: string;
  lastSeenAt: string;
  active: boolean;
}

// Post + MediaAsset + Recipient + ProfileClosedPostsItem live in `./posts`.

// ── Follow ────────────────────────────────────

export interface FollowEdge {
  readonly followerId: string;
  readonly followedId: string;
  readonly createdAt: string;
}

export interface FollowRequest {
  readonly requesterId: string;
  readonly targetId: string;
  readonly createdAt: string;
  status: FollowRequestStatus;
  cooldownUntil: string | null;
}

// ── Chat ──────────────────────────────────────

export interface Chat {
  readonly chatId: string;
  /**
   * Either participant may be null after an account deletion (migration 0028
   * — chats.participant_a/b are ON DELETE SET NULL so chats survive on the
   * counterpart side). Display layer renders null participants as "משתמש שנמחק".
   */
  readonly participantIds: [string | null, string | null];
  readonly anchorPostId: string | null;
  readonly isSupportThread: boolean;
  lastMessageAt: string | null;
  readonly createdAt: string;
}

export interface Message {
  readonly messageId: string;
  readonly chatId: string;
  readonly senderId: string | null;  // null = system message
  readonly kind: MessageKind;
  body: string;
  systemPayload: Record<string, unknown> | null;
  status: MessageStatus;
  readonly createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
}

// ── Report ────────────────────────────────────

export interface Report {
  readonly reportId: string;
  readonly reporterId: string;
  readonly targetType: ReportTargetType;
  readonly targetId: string | null;
  readonly reason: ReportReason;
  note: string | null;
  status: ReportStatus;
  readonly createdAt: string;
  resolvedAt: string | null;
}

// ── Moderation ────────────────────────────────

export interface ModerationQueueEntry {
  readonly entryId: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly reason: QueueReason;
  readonly createdAt: string;
  resolvedAt: string | null;
}

// ── Stats ─────────────────────────────────────

export interface CommunityStats {
  usersTotal: number;
  postsOpenPublic: number;
  postsClosedDeliveredTotal: number;
  asOf: string;
}

// ── City (reference) ──────────────────────────

export interface City {
  readonly cityId: string;
  readonly nameHe: string;
  readonly nameEn: string;
}

// ── ReportSubmission (FR-MOD-001 minimal — submission only) ───────────────

export interface ReportSubmission {
  targetType: ReportTargetType;
  targetId: string | null;             // null iff targetType === 'none'
  reason: ReportReason;
  note?: string;                       // ≤ REPORT_NOTE_MAX_LENGTH
}
