import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('migration da fundação organizacional', () => {
  it('cria a organização antes de tornar o escopo legado obrigatório', () => {
    const migrationPath = path.resolve(
      process.cwd(),
      'prisma/migrations/202608230001_organization_foundation/migration.sql',
    );
    const sql = readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('CREATE TYPE "MembershipRole"');
    expect(sql).toContain("'org_kapel', 'KAPEL', 'kapel'");
    expect(sql.indexOf('UPDATE "Client"')).toBeLessThan(
      sql.indexOf('ALTER COLUMN "organization_id" SET NOT NULL'),
    );
    expect(sql.indexOf('UPDATE "Contract"')).toBeLessThan(
      sql.lastIndexOf('ALTER COLUMN "organization_id" SET NOT NULL'),
    );
    expect(sql).toContain('FOREIGN KEY ("organization_id") REFERENCES "Organization"("id")');
  });
});
