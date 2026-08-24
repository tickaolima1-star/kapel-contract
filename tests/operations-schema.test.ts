import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('operations schema', () => {
  const schema = readFileSync(resolve('prisma/schema.prisma'), 'utf8');
  const sql = readFileSync(resolve('prisma/migrations/202608230002_operations_foundation/migration.sql'), 'utf8');

  it('defines tenant-safe operational entities and action history', () => {
    expect(schema).toMatch(/model Project[\s\S]*organization_id\s+String/);
    expect(schema).toMatch(/model ProjectUpdate[\s\S]*next_action\s+String/);
    expect(schema).toMatch(/model WorkItem[\s\S]*estimated_minutes\s+Int\?/);
    expect(schema).toMatch(/model OperationalBlocker[\s\S]*follow_up_at\s+DateTime\?/);
    expect(schema).toMatch(/model CommandAction[\s\S]*actor_membership_id\s+String/);
    expect(schema).toContain('@@unique([organization_id, source, external_id])');
    expect(schema).toContain('@@unique([organization_id, external_source, external_id])');
  });

  it('enforces numeric integrity in PostgreSQL', () => {
    expect(sql).toContain('CHECK ("strategic_value" BETWEEN 1 AND 5)');
    expect(sql).toContain('CHECK ("mental_load" BETWEEN 1 AND 5)');
    expect(sql).toContain('CHECK ("weekly_hours_estimate" >= 0)');
    expect(sql).toContain('CHECK ("monthly_value_at_risk" >= 0)');
    expect(sql).toContain('CHECK ("estimated_minutes" IS NULL OR "estimated_minutes" > 0)');
  });
});
