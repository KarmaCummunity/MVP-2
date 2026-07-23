import type {
  CompleteOnboardingInput,
  GloweProfile,
  IGloweProfileRepository,
} from '../ports/IGloweProfileRepository';

export interface CompleteOnboardingDeps {
  readonly profiles: IGloweProfileRepository;
}

export async function completeOnboarding(
  deps: CompleteOnboardingDeps,
  input: CompleteOnboardingInput,
): Promise<GloweProfile | null> {
  return deps.profiles.completeOnboarding(input);
}
