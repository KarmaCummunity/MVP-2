import type { LegalDocType, LegalDocumentContent } from '@kc/domain';

export interface AsyncKVStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const CACHE_KEY_PREFIX = 'legal:';

function cacheKey(docType: LegalDocType, version: number, contentHash: string): string {
  return `${CACHE_KEY_PREFIX}${docType}:v${version}:${contentHash}`;
}

function pointerKey(docType: LegalDocType): string {
  return `${CACHE_KEY_PREFIX}${docType}:pointer`;
}

interface SerializedContent {
  docType: LegalDocType;
  version: number;
  effectiveDateIso: string;
  bodyMd: string;
  contentHash: string;
  severity: LegalDocumentContent['severity'];
  changeSummary: string | null;
  publishedAtIso: string;
}

function serialize(c: LegalDocumentContent): SerializedContent {
  return {
    docType: c.docType,
    version: c.version,
    effectiveDateIso: c.effectiveDate.toISOString(),
    bodyMd: c.bodyMd,
    contentHash: c.contentHash,
    severity: c.severity,
    changeSummary: c.changeSummary,
    publishedAtIso: c.publishedAt.toISOString(),
  };
}

function deserialize(s: SerializedContent): LegalDocumentContent {
  return {
    docType: s.docType,
    version: s.version,
    effectiveDate: new Date(s.effectiveDateIso),
    bodyMd: s.bodyMd,
    contentHash: s.contentHash,
    severity: s.severity,
    changeSummary: s.changeSummary,
    publishedAt: new Date(s.publishedAtIso),
  };
}

export class LegalDocumentCache {
  constructor(private readonly storage: AsyncKVStorage) {}

  async readPointer(docType: LegalDocType): Promise<LegalDocumentContent | null> {
    const ptr = await this.storage.getItem(pointerKey(docType));
    if (!ptr) return null;
    const raw = await this.storage.getItem(ptr);
    if (!raw) return null;
    try {
      return deserialize(JSON.parse(raw) as SerializedContent);
    } catch {
      return null;
    }
  }

  async read(docType: LegalDocType, version: number, contentHash: string): Promise<LegalDocumentContent | null> {
    const raw = await this.storage.getItem(cacheKey(docType, version, contentHash));
    if (!raw) return null;
    try {
      return deserialize(JSON.parse(raw) as SerializedContent);
    } catch {
      return null;
    }
  }

  async write(content: LegalDocumentContent): Promise<void> {
    const ck = cacheKey(content.docType, content.version, content.contentHash);
    await this.storage.setItem(ck, JSON.stringify(serialize(content)));
    await this.storage.setItem(pointerKey(content.docType), ck);
  }
}
