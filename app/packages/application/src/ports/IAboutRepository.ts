import type { AboutTeamMember } from '@kc/domain';

/** About landing reads — team roster (FR-SETTINGS About). */
export interface IAboutRepository {
  listTeamMembers(): Promise<AboutTeamMember[]>;
}
