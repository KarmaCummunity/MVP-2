import { createMenuState, type CreateMenuState } from '@kc/glowe-domain';

import type { IGloweProfileRepository } from '../ports/IGloweProfileRepository';

export interface GetCreateMenuStateDeps {
  readonly profiles: IGloweProfileRepository;
}

export interface GetCreateMenuStateInput {
  readonly loggedIn: boolean;
}

export async function getCreateMenuState(
  deps: GetCreateMenuStateDeps,
  input: GetCreateMenuStateInput,
): Promise<CreateMenuState> {
  if (!input.loggedIn) {
    return createMenuState(false, null);
  }

  const profile = await deps.profiles.getMine();
  if (!profile) {
    return createMenuState(true, {});
  }

  return createMenuState(true, {
    accountType: profile.accountType ?? undefined,
    approvalStatus: profile.approvalStatus,
  });
}
