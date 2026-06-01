// FR-RIDE-035 — emergency trigger.
import type { RideEmergencyEvent } from '@kc/domain';
import type {
  IRideEmergencyRepository,
  TriggerRideEmergencyInput,
} from '../ports/IRideEmergencyRepository';

export class TriggerRideEmergencyUseCase {
  constructor(private readonly repo: IRideEmergencyRepository) {}

  async execute(input: TriggerRideEmergencyInput): Promise<RideEmergencyEvent> {
    return this.repo.trigger(input);
  }
}
