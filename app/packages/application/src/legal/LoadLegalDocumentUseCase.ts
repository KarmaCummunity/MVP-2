import type { LegalDocType, LegalDocumentContent } from '@kc/domain';
import type { ILegalDocumentRepository } from '../ports/ILegalDocumentRepository';

export interface LoadLegalDocumentInput {
  readonly docType: LegalDocType;
}

export class LoadLegalDocumentUseCase {
  constructor(private readonly repo: ILegalDocumentRepository) {}

  execute(input: LoadLegalDocumentInput): Promise<LegalDocumentContent> {
    return this.repo.getCurrentContent(input.docType);
  }
}
