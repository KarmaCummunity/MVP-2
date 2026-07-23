import { describe, expect, it } from 'vitest';

import type {
  IGloweAdminGateway,
  IGloweAuthGateway,
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
      {} as IGloweAuthGateway,
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
    expect(ports).toHaveLength(10);
  });
});
