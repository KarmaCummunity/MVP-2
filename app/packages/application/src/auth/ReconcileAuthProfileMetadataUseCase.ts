/** FR-PROFILE-001 / FR-AUTH-003 AC5: align JWT `user_metadata` with `public.users` when drifted. */
import type { AuthProfileMetadataPatch, IAuthService } from '../ports/IAuthService';
import type { IUserRepository } from '../ports/IUserRepository';

export interface ReconcileAuthProfileMetadataInput {
  readonly userId: string;
}

export class ReconcileAuthProfileMetadataUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly auth: IAuthService,
  ) {}

  async execute(input: ReconcileAuthProfileMetadataInput): Promise<void> {
    const userId = input.userId.trim();
    if (!userId) return;

    const [user, session] = await Promise.all([
      this.users.findById(userId),
      this.auth.getCurrentSession(),
    ]);
    if (!user || !session || session.userId !== userId) return;

    const patch = buildReconcilePatch(user, session);
    if (!patch) return;
    await this.auth.syncProfileMetadata(patch);
  }
}

function buildReconcilePatch(
  user: NonNullable<Awaited<ReturnType<IUserRepository['findById']>>>,
  session: { displayName: string | null; avatarUrl: string | null },
): AuthProfileMetadataPatch | null {
  const dbName = user.displayName?.trim() ?? '';
  const sessionName = session.displayName?.trim() ?? '';
  const nameDrift = dbName.length > 0 && dbName !== sessionName;
  const dbAvatar = user.avatarUrl ?? null;
  const sessionAvatar = session.avatarUrl ?? null;
  const avatarDrift = dbAvatar !== sessionAvatar;
  if (!nameDrift && !avatarDrift) return null;
  return {
    ...(nameDrift ? { displayName: dbName } : {}),
    ...(avatarDrift ? { avatarUrl: dbAvatar } : {}),
  };
}
