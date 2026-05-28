import { shouldBlockImmediately, type LegalDocType, type LegalPendingItem } from '@kc/domain';
import type { ILegalDocumentRepository } from '../ports/ILegalDocumentRepository';

export interface CheckPendingLegalAcksResult {
  readonly pending: readonly LegalPendingItem[];
  readonly mustBlockImmediately: boolean;
}

const ORDER: Record<LegalDocType, number> = { terms: 0, privacy: 1 };

export class CheckPendingLegalAcksUseCase {
  constructor(private readonly repo: ILegalDocumentRepository) {}

  async execute(): Promise<CheckPendingLegalAcksResult> {
    const raw = await this.repo.getPendingForCurrentUser();

    const seen = new Set<LegalDocType>();
    const deduped: LegalPendingItem[] = [];
    for (const item of raw) {
      if (seen.has(item.docType)) continue;
      seen.add(item.docType);
      deduped.push(item);
    }

    deduped.sort((a, b) => ORDER[a.docType] - ORDER[b.docType]);

    return {
      pending: deduped,
      mustBlockImmediately: shouldBlockImmediately(deduped),
    };
  }
}
