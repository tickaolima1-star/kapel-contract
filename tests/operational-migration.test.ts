import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Operational Schema Integrity', () => {
  it('valida a presença de tabelas operacionais e CHECK constraints', () => {
    const schema = readFileSync(resolve(__dirname, '../prisma/schema.prisma'), 'utf8');
    expect(schema).toContain('model Project');
    expect(schema).toContain('model ProjectUpdate');
    expect(schema).toContain('model WorkItem');
    expect(schema).toContain('model OperationalBlocker');
    expect(schema).toContain('model CommandAction');

    const migration = readFileSync(resolve(__dirname, '../prisma/migrations/202608240002_operational_foundation/migration.sql'), 'utf8');
    expect(migration).toContain('CHECK ("strategic_value" BETWEEN 1 AND 5)');
    expect(migration).toContain('CHECK ("mental_load" BETWEEN 1 AND 5)');
  });
});
