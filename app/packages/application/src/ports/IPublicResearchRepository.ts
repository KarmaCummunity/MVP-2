import type {
  PublicResearchBundle,
  PublicResearchSubmission,
  PublicResearchSubmitResult,
} from '@kc/domain';

export interface IPublicResearchRepository {
  /** Loads the public research bundle (questions + metadata) for the given slug. */
  loadBundle(slug: string): Promise<PublicResearchBundle>;

  /**
   * Submits an anonymous research response.
   * Honeypot enforcement is handled server-side (silent success gate).
   */
  submit(payload: PublicResearchSubmission): Promise<PublicResearchSubmitResult>;
}
