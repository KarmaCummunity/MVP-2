// FR-RIDE-041 — port for driver license + insurance declaration.

export interface DriverDeclaration {
  readonly userId: string;
  readonly declaredAt: string;
  readonly licenseDeclared: boolean;
  readonly insuranceDeclared: boolean;
  readonly noProfitAcknowledged: boolean;
}

export interface IDriverDeclarationRepository {
  /** Returns the caller's declaration row, or NULL if not yet accepted. */
  getMine(): Promise<DriverDeclaration | null>;

  /** Inserts the (all-true) declaration for the caller. Idempotent on already-set. */
  accept(): Promise<DriverDeclaration>;
}
