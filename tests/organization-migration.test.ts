import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Tenant migration script structure', () => {
  it('valida os scripts SQL de migração organizacional', () => {
    const migrationPath = resolve(__dirname, '../prisma/migrations/202608240001_organization_foundation/migration.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('CREATE TYPE "MembershipRole"');
    expect(sql).toContain('org_kapel');
    expect(sql).toContain('KAPEL');
    expect(sql).toContain('kapel');
    expect(sql.indexOf('UPDATE "Client"')).toBeLessThan(sql.indexOf('ALTER COLUMN "organization_id" SET NOT NULL'));
    expect(sql.indexOf('UPDATE "Contract"')).toBeLessThan(sql.lastIndexOf('ALTER COLUMN "organization_id" SET NOT NULL'));
  });
});
