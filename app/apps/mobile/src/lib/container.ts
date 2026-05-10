// Composition root — singleton instances of all chat use cases bound to Supabase adapters.
// Screens import the use cases from here, not from @kc/application directly.
// Mapped to SRS: FR-CHAT-001..013.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSupabaseClient,
  SupabaseChatRepository,
  SupabaseChatRealtime,
  SupabaseBlockRepository,
  SupabaseReportRepository,
  SupabaseDonationLinksRepository,
  type SupabaseAuthStorage,
} from '@kc/infrastructure-supabase';
import {
  ListChatsUseCase,
  OpenOrCreateChatUseCase,
  SendMessageUseCase,
  MarkChatReadUseCase,
  GetUnreadTotalUseCase,
  GetSupportThreadUseCase,
  BuildAutoMessageUseCase,
  BlockUserUseCase,
  UnblockUserUseCase,
  ReportChatUseCase,
  ListDonationLinksUseCase,
  AddDonationLinkUseCase,
  RemoveDonationLinkUseCase,
} from '@kc/application';

function pickStorage(): SupabaseAuthStorage | undefined {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.localStorage) return undefined;
    return window.localStorage;
  }
  return AsyncStorage;
}

const supabase = getSupabaseClient({ storage: pickStorage() });

const chatRepo = new SupabaseChatRepository(supabase);
const chatRealtime = new SupabaseChatRealtime(supabase);
const blockRepo = new SupabaseBlockRepository(supabase);
const reportRepo = new SupabaseReportRepository(supabase);
const donationLinksRepo = new SupabaseDonationLinksRepository(supabase);

export const container = {
  // Repos / realtime — exposed for chatStore subscription wiring.
  chatRepo,
  chatRealtime,

  // Chat use cases
  listChats: new ListChatsUseCase(chatRepo),
  openOrCreateChat: new OpenOrCreateChatUseCase(chatRepo),
  sendMessage: new SendMessageUseCase(chatRepo),
  markChatRead: new MarkChatReadUseCase(chatRepo),
  getUnreadTotal: new GetUnreadTotalUseCase(chatRepo),
  getSupportThread: new GetSupportThreadUseCase(chatRepo),
  buildAutoMessage: new BuildAutoMessageUseCase(),

  // Block / Report
  blockUser: new BlockUserUseCase(blockRepo),
  unblockUser: new UnblockUserUseCase(blockRepo),
  reportChat: new ReportChatUseCase(reportRepo),

  // Donation links
  listDonationLinks: new ListDonationLinksUseCase(donationLinksRepo),
  addDonationLink: new AddDonationLinkUseCase(donationLinksRepo),
  removeDonationLink: new RemoveDonationLinkUseCase(donationLinksRepo),
} as const;
