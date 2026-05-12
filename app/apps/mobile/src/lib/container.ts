// Composition root — singleton instances of all chat use cases bound to Supabase adapters.
// Screens import the use cases from here, not from @kc/application directly.
// Mapped to SRS: FR-CHAT-001..013, FR-POST-010, FR-POST-014 AC4, FR-POST-015 AC1, FR-MOD-001, FR-MOD-007, FR-ADMIN-009.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSupabaseClient,
  SupabaseChatRepository,
  SupabaseChatRealtime,
  SupabaseReportRepository,
  SupabaseDonationLinksRepository,
  SupabasePostRepository,
  SupabaseModerationAdminRepository,
  SupabaseAccountGateRepository,
  type SupabaseAuthStorage,
} from '@kc/infrastructure-supabase';
import {
  CheckAccountGateUseCase,
  ListChatsUseCase,
  OpenOrCreateChatUseCase,
  HideChatFromInboxUseCase,
  SendMessageUseCase,
  MarkChatReadUseCase,
  GetUnreadTotalUseCase,
  GetSupportThreadUseCase,
  BuildAutoMessageUseCase,
  ReportChatUseCase,
  ReportPostUseCase,
  DeletePostUseCase,
  AdminRemovePostUseCase,
  ListDonationLinksUseCase,
  AddDonationLinkUseCase,
  RemoveDonationLinkUseCase,
  RestoreTargetUseCase,
  DismissReportUseCase,
  ConfirmReportUseCase,
  BanUserUseCase,
  DeleteMessageUseCase,
  LookupAuditUseCase,
  ReportUserUseCase,
} from '@kc/application';

function pickStorage(): SupabaseAuthStorage | undefined {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.localStorage) return undefined;
    return window.localStorage;
  }
  return AsyncStorage;
}

export const supabase = getSupabaseClient({ storage: pickStorage() });

const chatRepo = new SupabaseChatRepository(supabase);
const chatRealtime = new SupabaseChatRealtime(supabase);
const reportRepo = new SupabaseReportRepository(supabase);
const donationLinksRepo = new SupabaseDonationLinksRepository(supabase);
const postRepo = new SupabasePostRepository(supabase);
const moderationAdminRepo = new SupabaseModerationAdminRepository(supabase);
const accountGateRepo = new SupabaseAccountGateRepository(supabase);

const hideChatFromInbox = new HideChatFromInboxUseCase(chatRepo);

const hideChatFromInbox = new HideChatFromInboxUseCase(chatRepo);

export const container = {
  // Repos / realtime — exposed for chatStore subscription wiring.
  chatRepo,
  chatRealtime,
  moderationAdminRepo, // exposed for hooks that need adminRepo.isUserAdmin pre-checks

  // Chat use cases
  listChats: new ListChatsUseCase(chatRepo),
  openOrCreateChat: new OpenOrCreateChatUseCase(chatRepo),
  hideChatFromInbox,
  sendMessage: new SendMessageUseCase(chatRepo),
  markChatRead: new MarkChatReadUseCase(chatRepo),
  getUnreadTotal: new GetUnreadTotalUseCase(chatRepo),
  getSupportThread: new GetSupportThreadUseCase(chatRepo),
  buildAutoMessage: new BuildAutoMessageUseCase(),

  // Reports
  reportChat: new ReportChatUseCase(reportRepo),
  reportPost: new ReportPostUseCase(reportRepo),

  // Post moderation
  deletePost: new DeletePostUseCase(postRepo),
  adminRemovePost: new AdminRemovePostUseCase(postRepo),

  // Moderation admin actions (FR-MOD-007 + FR-ADMIN-002..007)
  restoreTarget: new RestoreTargetUseCase(moderationAdminRepo),
  dismissReport: new DismissReportUseCase(moderationAdminRepo),
  confirmReport: new ConfirmReportUseCase(moderationAdminRepo),
  banUser: new BanUserUseCase(moderationAdminRepo),
  deleteMessage: new DeleteMessageUseCase(moderationAdminRepo),
  lookupAudit: new LookupAuditUseCase(moderationAdminRepo),
  reportUser: new ReportUserUseCase(reportRepo),

  // FR-MOD-010 — sign-in + mid-session account gate.
  checkAccountGate: new CheckAccountGateUseCase(accountGateRepo),

  // Donation links
  listDonationLinks: new ListDonationLinksUseCase(donationLinksRepo),
  addDonationLink: new AddDonationLinkUseCase(donationLinksRepo),
  removeDonationLink: new RemoveDonationLinkUseCase(donationLinksRepo),
} as const;
