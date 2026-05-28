import { describe, expect, it } from 'vitest';
import type { AdminAuditRow } from '@kc/domain';
import { rowsToCsv } from '../auditCsvExport';

const BOM = '\ufeff';

function row(overrides: Partial<AdminAuditRow> = {}): AdminAuditRow {
  return {
    eventId: 'e-1',
    actorId: 'u-actor',
    actorDisplayName: 'Actor',
    action: 'ban_user',
    targetType: 'user',
    targetId: 'u-target',
    targetDisplayName: 'Target',
    metadata: {},
    createdAt: new Date('2026-05-28T01:23:45.000Z'),
    ...overrides,
  };
}

function stripBom(csv: string): string {
  return csv.startsWith(BOM) ? csv.slice(1) : csv;
}

describe('auditCsvExport.rowsToCsv', () => {
  it('emits the canonical header line', () => {
    const csv = rowsToCsv([row()]);
    const firstLine = stripBom(csv).split('\r\n')[0];
    expect(firstLine).toBe(
      'event_id,created_at,action,actor_id,actor,target_type,target_id,target,metadata',
    );
  });

  it('escapes commas, quotes, and newlines per RFC 4180', () => {
    const csv = rowsToCsv([
      row({ actorDisplayName: 'Smith, John', metadata: { note: 'has "quotes"' } }),
      row({ eventId: 'e-2', actorDisplayName: 'Has\nNewline' }),
    ]);
    const lines = stripBom(csv).split('\r\n');
    expect(lines[1]).toContain('"Smith, John"');
    expect(lines[2]).toContain('"Has\nNewline"');
  });

  it('emits a UTF-8 BOM so Excel detects the encoding for Hebrew names', () => {
    const csv = rowsToCsv([row()]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it('serialises metadata via JSON.stringify and double-quotes embedded quotes', () => {
    const csv = rowsToCsv([row({ metadata: { reason: 'spam', count: 3 } })]);
    // RFC 4180: a field containing a comma must be quoted, and embedded
    // double-quotes are doubled. JSON.stringify produces "" around keys so
    // each is doubled to "" twice in the CSV form.
    expect(csv).toContain('"{""reason"":""spam"",""count"":3}"');
  });

  it('treats null actor/target as empty fields', () => {
    const csv = rowsToCsv([row({
      actorId: null, actorDisplayName: null,
      targetId: null, targetDisplayName: null, targetType: null,
    })]);
    const cells = stripBom(csv).split('\r\n')[1]?.split(',') ?? [];
    expect(cells[3]).toBe(''); // actor_id
    expect(cells[4]).toBe(''); // actor
    expect(cells[5]).toBe(''); // target_type
    expect(cells[6]).toBe(''); // target_id
    expect(cells[7]).toBe(''); // target
  });
});
