/** About landing team roster — profile shell linked by role_key (FR-SETTINGS About). */

export interface AboutTeamMember {
  readonly roleKey: string;
  readonly sortOrder: number;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly shareHandle: string;
}
