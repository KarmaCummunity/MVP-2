import { AuthError } from './errors';

/** Defense-in-depth: mutating use cases must match the authenticated session user. */
export function assertSessionUser(sessionUserId: string, inputUserId: string): void {
  if (sessionUserId !== inputUserId) {
    throw new AuthError('forbidden', 'forbidden');
  }
}
