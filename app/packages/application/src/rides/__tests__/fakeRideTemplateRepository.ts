// FR-RIDE-022 — in-memory fake for IRideTemplateRepository.
import type { RideTemplate, RideTemplateStatus } from '@kc/domain';
import type {
  CreateRideTemplateInput,
  IRideTemplateRepository,
} from '../../ports/IRideTemplateRepository';

export class FakeRideTemplateRepository implements IRideTemplateRepository {
  rows: RideTemplate[] = [];
  private nextId = 1;
  deletedIds: string[] = [];

  async create(input: CreateRideTemplateInput): Promise<RideTemplate> {
    const now = new Date().toISOString();
    const row: RideTemplate = {
      templateId: `t_${this.nextId++}`,
      ownerId: input.ownerId,
      mode: input.mode,
      originCityId: input.originCityId,
      destCityId: input.destCityId,
      originStreet: input.originStreet,
      originStreetNumber: input.originStreetNumber,
      destStreet: input.destStreet,
      destStreetNumber: input.destStreetNumber,
      departTime: input.departTime,
      weekdayMask: input.weekdayMask,
      seatsAvailable: input.seatsAvailable,
      description: input.description,
      visibility: input.visibility,
      status: 'active',
      lookaheadDays: input.lookaheadDays,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.push(row);
    return row;
  }

  async getById(templateId: string): Promise<RideTemplate | null> {
    return this.rows.find((r) => r.templateId === templateId) ?? null;
  }

  async listForOwner(ownerId: string): Promise<readonly RideTemplate[]> {
    return this.rows
      .filter((r) => r.ownerId === ownerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async setStatus(templateId: string, status: RideTemplateStatus): Promise<RideTemplate> {
    const idx = this.rows.findIndex((r) => r.templateId === templateId);
    if (idx < 0) throw new Error('not_found');
    const row = this.rows[idx]!;
    const updated: RideTemplate = { ...row, status, updatedAt: new Date().toISOString() };
    this.rows[idx] = updated;
    return updated;
  }

  async delete(templateId: string): Promise<void> {
    const idx = this.rows.findIndex((r) => r.templateId === templateId);
    if (idx < 0) return;
    this.rows.splice(idx, 1);
    this.deletedIds.push(templateId);
  }
}
