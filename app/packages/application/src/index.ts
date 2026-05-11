export * from './ports/IUserRepository';
export * from './ports/IPostRepository';
export * from './ports/IChatRepository';
export * from './ports/IAuthService';
export * from './ports/ICityRepository';
export type { IChatRealtime, InboxStreamCallbacks, ChatStreamCallbacks, Unsubscribe } from './ports/IChatRealtime';
export type { IReportRepository } from './ports/IReportRepository';
export type { IFeedRealtime, FeedRealtimeCallbacks } from './ports/IFeedRealtime';
export type { IStatsRepository } from './ports/IStatsRepository';

export * from './auth/errors';
export * from './auth/SignUpWithEmail';
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

export * from './posts/errors';
export * from './posts/CreatePostUseCase';
export * from './posts/UpdatePostUseCase';
export * from './posts/GetPostByIdUseCase';
export * from './posts/GetMyPostsUseCase';
export * from './posts/DeletePostUseCase';
export * from './posts/MarkAsDeliveredUseCase';
export * from './posts/ReopenPostUseCase';
export * from './posts/GetClosureCandidatesUseCase';
export * from './posts/AdminRemovePostUseCase';
export * from './posts/SearchUsersForClosureUseCase';

export * from './auth/DismissClosureExplainerUseCase';

// Chat use cases
export { BuildAutoMessageUseCase } from './chat/BuildAutoMessageUseCase';
export { SendMessageUseCase } from './chat/SendMessageUseCase';
export type { SendMessageInput } from './chat/SendMessageUseCase';
export { OpenOrCreateChatUseCase } from './chat/OpenOrCreateChatUseCase';
export type { OpenOrCreateChatInput } from './chat/OpenOrCreateChatUseCase';
export { ListChatsUseCase } from './chat/ListChatsUseCase';
export { MarkChatReadUseCase } from './chat/MarkChatReadUseCase';
export { GetUnreadTotalUseCase } from './chat/GetUnreadTotalUseCase';
export { GetSupportThreadUseCase } from './chat/GetSupportThreadUseCase';
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
export type { IDonationLinksRepository, AddDonationLinkInput } from './ports/IDonationLinksRepository';
export { ListDonationLinksUseCase } from './donations/ListDonationLinksUseCase';
export { AddDonationLinkUseCase } from './donations/AddDonationLinkUseCase';
export { RemoveDonationLinkUseCase } from './donations/RemoveDonationLinkUseCase';
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
