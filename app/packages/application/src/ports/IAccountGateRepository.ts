export type AccountGateReason =
  | 'banned'
  | 'suspended_admin'
  | 'suspended_for_false_reports';

export interface AccountGateResult {
  readonly allowed: boolean;
  readonly reason?: AccountGateReason;
  readonly until?: string;  // ISO timestamp
}

export interface IAccountGateRepository {
  checkAccountGate(userId: string): Promise<AccountGateResult>;
}
