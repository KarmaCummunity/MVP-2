import type {
  IAccountGateRepository,
  AccountGateResult,
} from '../../ports/IAccountGateRepository';

export class FakeAccountGateRepository implements IAccountGateRepository {
  public result: AccountGateResult = { allowed: true };
  public calls: string[] = [];

  async checkAccountGate(userId: string): Promise<AccountGateResult> {
    this.calls.push(userId);
    return this.result;
  }
}
