/**
 * ListAboutTeamMembersUseCase — reads `about_team_profiles` (FR-SETTINGS About).
 */
import type { AboutTeamMember } from '@kc/domain';
import type { IAboutRepository } from '../ports/IAboutRepository';

export class ListAboutTeamMembersUseCase {
  constructor(private readonly about: IAboutRepository) {}

  async execute(): Promise<AboutTeamMember[]> {
    return this.about.listTeamMembers();
  }
}
