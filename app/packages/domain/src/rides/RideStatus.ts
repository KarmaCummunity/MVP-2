// FR-RIDE-031 — active-ride lifecycle extends the status FSM with two
// transient states between `open` and the terminal trio.
export type RideStatus =
  | 'open'
  | 'in_transit'
  | 'completed_pending_rating'
  | 'closed'
  | 'cancelled'
  | 'expired';
