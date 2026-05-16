export * from './ports/IUserRepository';
export * from './ports/IPostRepository';
export * from './ports/IChatRepository';
export * from './ports/IAuthService';
export * from './ports/ICityRepository';
export type {
  IChatRealtime,
  InboxStreamCallbacks,
  SubscribeInboxOptions,
  ChatStreamCallbacks,
  Unsubscribe,
} from './ports/IChatRealtime';
export type { IReportRepository } from './ports/IReportRepository';
export type { IFeedRealtime, FeedRealtimeCallbacks } from './ports/IFeedRealtime';
export type { CommunityStatsSnapshot, IStatsRepository } from './ports/IStatsRepository';

export * from './auth/errors';
export * from './auth/SignUpWithEmail';
export { ResendVerificationEmailUseCase, type ResendVerificationEmailInput } from './auth/ResendVerificationEmail';
export { VerifyEmailUseCase, type VerifyEmailInput, type VerifyEmailOutput } from './auth/VerifyEmail';
export * from './auth/SignInWithEmail';
export * from './auth/SignInWithGoogle';
export * from './auth/SignOut';
export * from './auth/RestoreSession';
export * from './auth/CompleteBasicInfoUseCase';
export * from './auth/CompleteOnboardingUseCase';
export * from './auth/SetAvatarUseCase';
export * from './auth/UpdateProfileUseCase';
export * from './auth/DeleteAccountUseCase';
export * from './feed/selectGuestPreviewPosts';
export * from './feed/GetFeedUseCase';
export * from './feed/GetActivePostsCountUseCase';
export * from './feed/DismissFirstPostNudgeUseCase';
export * from './stats/GetCommunityStatsSnapshotUseCase';
export * from './stats/ListMyActivityTimelineUseCase';

export * from './posts/errors';
export * from './posts/CreatePostUseCase';
export * from './posts/UpdatePostUseCase';
export * from './posts/GetPostByIdUseCase';
export * from './posts/GetMyPostsUseCase';
export * from './posts/GetProfileClosedPostsUseCase';
export * from './posts/DeletePostUseCase';
export * from './posts/MarkAsDeliveredUseCase';
export * from './posts/ReopenPostUseCase';
export * from './posts/UnmarkRecipientSelfUseCase';
export * from './posts/GetClosureCandidatesUseCase';
export * from './posts/AdminRemovePostUseCase';
export * from './posts/SearchUsersForClosureUseCase';

export * from './auth/DismissClosureExplainerUseCase';

// Chat use cases
export { SendMessageUseCase } from './chat/SendMessageUseCase';
export type { SendMessageInput } from './chat/SendMessageUseCase';
export { HideChatFromInboxUseCase } from './chat/HideChatFromInboxUseCase';
export type { HideChatFromInboxInput } from './chat/HideChatFromInboxUseCase';
export { OpenOrCreateChatUseCase } from './chat/OpenOrCreateChatUseCase';
export type { OpenOrCreateChatInput } from './chat/OpenOrCreateChatUseCase';
export { ListChatsUseCase } from './chat/ListChatsUseCase';
export { MarkChatReadUseCase } from './chat/MarkChatReadUseCase';
export { GetUnreadTotalUseCase } from './chat/GetUnreadTotalUseCase';
export { GetSupportThreadUseCase } from './chat/GetSupportThreadUseCase';
export { SubmitSupportIssueUseCase } from './chat/SubmitSupportIssueUseCase';
export type { SubmitSupportIssueInput } from './chat/SubmitSupportIssueUseCase';
export { ChatError } from './chat/errors';
export type { ChatErrorCode } from './chat/errors';

// Report use cases
export { ReportChatUseCase } from './reports/ReportChatUseCase';
export type { ReportChatInput } from './reports/ReportChatUseCase';
export { ReportPostUseCase } from './reports/ReportPostUseCase';
export type { ReportPostInput } from './reports/ReportPostUseCase';
export { ReportError } from './reports/errors';
export type { ReportErrorCode } from './reports/errors';

// Donation link use cases
export type {
  IDonationLinksRepository,
  AddDonationLinkInput,
  UpdateDonationLinkInput,
} from './ports/IDonationLinksRepository';
export { ListDonationLinksUseCase } from './donations/ListDonationLinksUseCase';
export { AddDonationLinkUseCase } from './donations/AddDonationLinkUseCase';
export { UpdateDonationLinkUseCase } from './donations/UpdateDonationLinkUseCase';
export { RemoveDonationLinkUseCase } from './donations/RemoveDonationLinkUseCase';
export { ReportDonationLinkUseCase } from './donations/ReportDonationLinkUseCase';
export type { ReportDonationLinkInput } from './donations/ReportDonationLinkUseCase';
export { DonationLinkError } from './donations/errors';
export type { DonationLinkErrorCode } from './donations/errors';

// Follow use cases (P1.1)
export * from './follow/errors';
export * from './follow/types';
export * from './follow/FollowUserUseCase';
export * from './follow/UnfollowUserUseCase';
export * from './follow/SendFollowRequestUseCase';
export * from './follow/CancelFollowRequestUseCase';
export * from './follow/AcceptFollowRequestUseCase';
export * from './follow/RejectFollowRequestUseCase';
export * from './follow/RemoveFollowerUseCase';
export * from './follow/ListFollowersUseCase';
export * from './follow/ListFollowingUseCase';
export * from './follow/ListPendingFollowRequestsUseCase';
export * from './follow/GetFollowStateUseCase';
export * from './follow/UpdatePrivacyModeUseCase';

// Search use cases
export type { ISearchRepository, UniversalSearchResults } from './ports/ISearchRepository';
export { UniversalSearchUseCase } from './search/UniversalSearchUseCase';
export type { UniversalSearchInput } from './search/UniversalSearchUseCase';

export * from './ports/IModerationAdminRepository';
export * from './ports/IAccountGateRepository';
export * from './moderation/errors';

// Moderation admin use cases (FR-MOD-007 + FR-ADMIN-002..007)
export { RestoreTargetUseCase } from './moderation/RestoreTargetUseCase';
export type { RestoreTargetInput } from './moderation/RestoreTargetUseCase';
export { DismissReportUseCase } from './moderation/DismissReportUseCase';
export type { DismissReportInput } from './moderation/DismissReportUseCase';
export { ConfirmReportUseCase } from './moderation/ConfirmReportUseCase';
export type { ConfirmReportInput } from './moderation/ConfirmReportUseCase';
export { BanUserUseCase } from './moderation/BanUserUseCase';
export type { BanUserInput } from './moderation/BanUserUseCase';
export { DeleteMessageUseCase } from './moderation/DeleteMessageUseCase';
export type { DeleteMessageInput } from './moderation/DeleteMessageUseCase';
export { LookupAuditUseCase } from './moderation/LookupAuditUseCase';
export type { LookupAuditInput } from './moderation/LookupAuditUseCase';
export { ReportUserUseCase } from './moderation/ReportUserUseCase';
export type { ReportUserInput } from './moderation/ReportUserUseCase';
export { CheckAccountGateUseCase } from './moderation/CheckAccountGateUseCase';
export type { CheckAccountGateInput } from './moderation/CheckAccountGateUseCase';

export type { IDeviceRepository } from './notifications/IDeviceRepository';
export { RegisterDeviceUseCase } from './notifications/RegisterDeviceUseCase';
export { DeactivateDeviceUseCase } from './notifications/DeactivateDeviceUseCase';
export { UpdateNotificationPreferencesUseCase } from './notifications/UpdateNotificationPreferencesUseCase';
