import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(__dirname, '..');
const readRepoFile = (relativePath: string) =>
  readFileSync(resolve(repoRoot, relativePath), 'utf8');

describe('cross-agent toolkit contract', () => {
  it('exposes a root Codex entrypoint backed by the shared skill catalog', () => {
    const entrypoint = readRepoFile('AGENTS.md');
    expect(entrypoint).toContain('.agents/skills/');
    expect(entrypoint).toContain('.agents/AGENTS.md');
    expect(entrypoint).toContain('npm run typecheck');
    expect(entrypoint).toContain('npm test');
    expect(entrypoint).toContain('npm run build');
  });

  it('defines the project stack and skill-first lifecycle once in shared guidance', () => {
    const guide = readRepoFile('.agents/AGENTS.md');
    for (const token of ['Next.js 14', 'TypeScript', 'Prisma', 'Supabase', 'Vitest']) {
      expect(guide).toContain(token);
    }
    expect(guide).toContain('brainstorming');
    expect(guide).toContain('systematic-debugging');
    expect(guide).toContain('verification-before-completion');
  });

  it('provides native adapters without executable Claude plugin commands', () => {
    const adapterPaths = [
      '.agents/adapters/codex.md',
      '.agents/adapters/antigravity.md',
    ];
    for (const path of adapterPaths) {
      const content = readRepoFile(path);
      for (const action of ['task tracking', 'subagent', 'skill', 'verification']) {
        expect(content.toLowerCase()).toContain(action);
      }
      expect(content).not.toMatch(/^\s*\/plugin\s/gm);
    }
  });

  it('defines concise Antigravity workspace rules', () => {
    const core = readRepoFile('.agents/rules/core.md');
    const typescript = readRepoFile('.agents/rules/typescript.md');
    expect(core.length).toBeLessThan(12_000);
    expect(typescript.length).toBeLessThan(12_000);
    expect(core).toContain('@.agents/AGENTS.md');
    expect(core).toContain('Always On');
    expect(typescript).toContain('src/**/*.ts');
    expect(typescript).toContain('src/**/*.tsx');
  });
});
