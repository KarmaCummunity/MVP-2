import type {
  AcceptLegalDocumentInput,
  AcceptLegalDocumentResult,
  ILegalDocumentRepository,
} from '../ports/ILegalDocumentRepository';

const MAX_USER_AGENT_LEN = 500;

export class AcceptLegalDocumentUseCase {
  constructor(private readonly repo: ILegalDocumentRepository) {}

  execute(input: AcceptLegalDocumentInput): Promise<AcceptLegalDocumentResult> {
    return this.repo.acceptVersion({
      docType: input.docType,
      version: input.version,
      locale: input.locale,
      userAgent: input.userAgent.slice(0, MAX_USER_AGENT_LEN),
    });
  }
}
