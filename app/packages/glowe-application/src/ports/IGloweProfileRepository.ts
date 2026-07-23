// FR-GLOWE-002 / FR-GLOWE-011 — profile read/write port (backend.js profile block).

export type GloweAccountType = 'individual' | 'organization';

export type GloweApprovalStatus =
  | 'not_required'
  | 'pending'
  | 'approved'
  | 'rejected';

export interface GloweProfile {
  readonly id: string;
  readonly name: string;
  readonly nameEn: string;
  readonly email: string;
  readonly type: string;
  readonly focus: string;
  readonly about: string;
  readonly needs: string;
  readonly location: string;
  readonly languages: readonly string[];
  readonly availability: string;
  readonly skills: readonly string[];
  readonly avatarUrl: string;
  readonly profileStatus: string | null;
  readonly accountType: GloweAccountType | null;
  readonly onboardingComplete: boolean;
  readonly approvalStatus: GloweApprovalStatus;
  readonly country: string;
  readonly orgName: string;
  readonly orgNameEn: string;
  readonly orgWebsite: string;
  readonly orgRegistrationNumber: string;
  readonly orgCountry: string;
  readonly orgField: string;
  readonly orgDescription: string;
  readonly orgContactName: string;
  readonly orgContactEmail: string;
  readonly orgContactPhone: string;
  readonly orgSize: string;
  readonly orgSubmittedAt: string | null;
  readonly orgReviewNote: string;
}

export interface GloweOrgOnboardingInput {
  readonly name?: string;
  readonly nameEn?: string;
  readonly website?: string;
  readonly registrationNumber?: string;
  readonly country?: string;
  readonly field?: string;
  readonly description?: string;
  readonly contactName?: string;
  readonly contactEmail?: string;
  readonly contactPhone?: string;
  readonly size?: string;
}

export interface CompleteOnboardingInput {
  readonly accountType: GloweAccountType;
  readonly displayName?: string;
  readonly displayNameEn?: string;
  readonly about?: string;
  readonly country?: string;
  readonly org?: GloweOrgOnboardingInput;
}

export interface UpsertProfileInput {
  readonly name?: string;
  readonly nameEn?: string;
  readonly type?: string;
  readonly focus?: string;
  readonly about?: string;
  readonly needs?: string;
  readonly location?: string;
  readonly languages?: readonly string[];
  readonly availability?: string;
  readonly skills?: readonly string[];
  readonly avatarUrl?: string;
  readonly profileStatus?: string | null;
  readonly country?: string;
  readonly orgName?: string;
  readonly orgNameEn?: string;
}

export interface GloweGoogleUser {
  readonly id: string;
  readonly email?: string;
  readonly user_metadata?: {
    readonly name?: string;
    readonly full_name?: string;
    readonly email?: string;
    readonly avatar_url?: string;
    readonly picture?: string;
  };
}

export interface ProfileEnglishNamePatch {
  readonly id: string;
  readonly display_name_en?: string | null;
  readonly org_name_en?: string | null;
}

export interface IGloweProfileRepository {
  getById(id: string): Promise<GloweProfile | null>;
  getMine(): Promise<GloweProfile | null>;
  upsert(profile: UpsertProfileInput): Promise<GloweProfile | null>;
  completeOnboarding(details: CompleteOnboardingInput): Promise<GloweProfile | null>;
  deleteMine(): Promise<boolean | null>;
  uploadAvatar(file: Blob): Promise<string | null>;
  ensureFromGoogle(user: GloweGoogleUser): Promise<GloweProfile | null>;
  ensureEnglishNames(profileIds: readonly string[]): Promise<readonly ProfileEnglishNamePatch[]>;
  listApprovedOrgs(): Promise<readonly GloweProfile[] | null>;
  listMembers(): Promise<readonly GloweProfile[] | null>;
}
