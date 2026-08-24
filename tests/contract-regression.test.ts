import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(path), 'utf8');
describe('Contract remains a separate functional module', () => {
  it('keeps the commercial dashboard and adds distinct operational routes', () => {
    expect(read('src/app/dashboard/page.tsx')).toContain('title="Painel Operacional"');
    expect(read('src/app/command/page.tsx')).toContain('title="Command"');
    expect(read('src/app/operations/page.tsx')).toContain('title="Operations"');
    expect(read('src/components/Sidebar.tsx')).toContain("href: '/contracts'");
  });
  it('keeps public signature and verification handlers public', () => {
    expect(read('src/app/api/contracts/public/sign/[token]/route.ts')).toContain('export async function GET');
    expect(read('src/app/api/contracts/public/verify/[hash]/route.ts')).toContain('export async function GET');
  });
  it('documents the exact deployment order', () => {
    expect(read('docs/kapel-command-foundation-runbook.md')).toContain('Configure `JWT_SECRET`');
  });
});
