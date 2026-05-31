// FR-RIDE-041 — accept the driver declaration (one-time gate before publishing offers).
import type {
  DriverDeclaration,
  IDriverDeclarationRepository,
} from '../ports/IDriverDeclarationRepository';

export class AcceptDriverDeclarationUseCase {
  constructor(private readonly repo: IDriverDeclarationRepository) {}

  async execute(): Promise<DriverDeclaration> {
    return this.repo.accept();
  }
}
