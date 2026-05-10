import {
  type DonationLink,
  DONATION_LINK_DESCRIPTION_MAX,
  DONATION_LINK_DISPLAY_NAME_MAX,
  DONATION_LINK_DISPLAY_NAME_MIN,
  DONATION_LINK_URL_PATTERN,
} from '@kc/domain';
import type {
  AddDonationLinkInput,
  IDonationLinksRepository,
} from '../ports/IDonationLinksRepository';
import { DonationLinkError } from './errors';

export class AddDonationLinkUseCase {
  constructor(private readonly repo: IDonationLinksRepository) {}

  async execute(input: AddDonationLinkInput): Promise<DonationLink> {
    const url = input.url.trim();
    const displayName = input.displayName.trim();
    const description = input.description == null ? null : input.description.trim();

    if (!DONATION_LINK_URL_PATTERN.test(url)) {
      throw new DonationLinkError('invalid_url', 'URL must start with http:// or https://');
    }
    if (displayName.length < DONATION_LINK_DISPLAY_NAME_MIN || displayName.length > DONATION_LINK_DISPLAY_NAME_MAX) {
      throw new DonationLinkError('invalid_input', 'Display name length out of range');
    }
    if (description !== null && description.length > DONATION_LINK_DESCRIPTION_MAX) {
      throw new DonationLinkError('invalid_input', 'Description too long');
    }

    return this.repo.addViaEdgeFunction({
      categorySlug: input.categorySlug,
      url,
      displayName,
      description: description && description.length > 0 ? description : null,
    });
  }
}
