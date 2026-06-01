// FR-RIDE-011 — ride participant status machine.
//   requested → {approved, rejected, cancelled}
//   approved  → cancelled
// `rejected` and `cancelled` are terminal.
export type RideParticipantStatus = 'requested' | 'approved' | 'rejected' | 'cancelled';
