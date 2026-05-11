export { getSupabaseClient, resetSupabaseClient } from './client';
export type { SupabaseAuthStorage } from './client';
export type { Database } from './database.types';

export { SupabaseAuthService } from './auth/SupabaseAuthService';
export { SupabaseUserRepository } from './users/SupabaseUserRepository';
export { SupabaseCityRepository } from './cities/SupabaseCityRepository';
export { SupabasePostRepository } from './posts/SupabasePostRepository';
export { SupabaseChatRepository } from './chat/SupabaseChatRepository';
export { SupabaseChatRealtime } from './chat/SupabaseChatRealtime';
export { SupabaseFeedRealtime } from './feed/SupabaseFeedRealtime';
export { SupabaseStatsRepository } from './stats/SupabaseStatsRepository';
export { SupabaseReportRepository } from './reports/SupabaseReportRepository';
export { SupabaseDonationLinksRepository } from './donations/SupabaseDonationLinksRepository';
export { SupabaseSearchRepository } from './search/SupabaseSearchRepository';
