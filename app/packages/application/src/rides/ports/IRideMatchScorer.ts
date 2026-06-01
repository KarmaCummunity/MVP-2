export interface IRideMatchScorer {
  sort<T extends { departsAt: string }>(rows: T[]): T[];
}
