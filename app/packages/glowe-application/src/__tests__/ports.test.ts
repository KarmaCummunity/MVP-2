import { describe, expect, it } from 'vitest';

import type {
  IGloweAdminGateway,
  IGloweChatGateway,
  IGloweFollowGateway,
  IGloweForumRepository,
  IGloweModerationGateway,
  IGloweOpportunityRepository,
  IGlowePostRepository,
  IGloweProfileRepository,
  IGloweSavedRepository,
} from '../index';

describe('@kc/glowe-application ports', () => {
  it('exports compile-time port interfaces for all aggregates', () => {
    const ports: unknown[] = [
      {} as IGloweProfileRepository,
      {} as IGlowePostRepository,
      {} as IGloweOpportunityRepository,
      {} as IGloweForumRepository,
      {} as IGloweFollowGateway,
      {} as IGloweChatGateway,
      {} as IGloweSavedRepository,
      {} as IGloweModerationGateway,
      {} as IGloweAdminGateway,
    ];
    expect(ports).toHaveLength(9);
  });
});
