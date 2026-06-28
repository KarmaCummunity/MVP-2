// FR-RIDE-041 — read the caller's declaration (NULL = not yet accepted).
import type {
  DriverDeclaration,
  IDriverDeclarationRepository,
} from '../ports/IDriverDeclarationRepository';

export class GetDriverDeclarationUseCase {
  constructor(private readonly repo: IDriverDeclarationRepository) {}

  async execute(): Promise<DriverDeclaration | null> {
    return this.repo.getMine();
  }
}
