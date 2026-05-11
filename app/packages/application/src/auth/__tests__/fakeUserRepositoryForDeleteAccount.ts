// In-memory fake covering only deleteAccountViaEdgeFunction for DeleteAccountUseCase tests.

import { DeleteAccountError } from '../errors';

export class FakeUserRepositoryForDeleteAccount {
  deleteAccountCallCount = 0;
  errorToThrow: DeleteAccountError | null = null;

  deleteAccountViaEdgeFunction = async (): Promise<void> => {
    this.deleteAccountCallCount += 1;
    if (this.errorToThrow) throw this.errorToThrow;
  };
}
