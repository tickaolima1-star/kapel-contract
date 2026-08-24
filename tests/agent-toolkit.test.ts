import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(__dirname, '..');
const readRepoFile = (relativePath: string) =>
  readFileSync(resolve(repoRoot, relativePath), 'utf8');

const workflowNames = [
  'brainstorm-to-plan',
  'project-sanitize',
  'lint-burndown',
  'multi-agent-review',
  'parallel-wave-dispatch',
  'memory-capture',
  'quality-gates',
] as const;

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

  it('ships unique, bounded, slash-invocable workflows', () => {
    expect(new Set(workflowNames).size).toBe(workflowNames.length);
    for (const name of workflowNames) {
      const content = readRepoFile(`.agents/workflows/${name}.md`);
      expect(content).toMatch(/^# /);
      expect(content).toContain('## Description');
      expect(content).toContain('## Steps');
      expect(content.length).toBeLessThan(12_000);
      expect(content).not.toMatch(/^\s*\/plugin\s/gm);
    }
  });

  it('routes process workflows through installed Superpowers skills', () => {
    expect(readRepoFile('.agents/workflows/brainstorm-to-plan.md')).toContain('brainstorming');
    expect(readRepoFile('.agents/workflows/brainstorm-to-plan.md')).toContain('writing-plans');
    expect(readRepoFile('.agents/workflows/multi-agent-review.md')).toContain('requesting-code-review');
    expect(readRepoFile('.agents/workflows/parallel-wave-dispatch.md')).toContain('dispatching-parallel-agents');
    expect(readRepoFile('.agents/workflows/quality-gates.md')).toContain('verification-before-completion');
  });

  it('exposes canonical validation commands', () => {
    const pkg = JSON.parse(readRepoFile('package.json')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts.typecheck).toBe('tsc --noEmit');
    expect(pkg.scripts['test:agent-toolkit']).toBe('vitest run tests/agent-toolkit.test.ts');
  });

  it('documents functional parity and explicit compatibility boundaries', () => {
    const docs = readRepoFile('docs/AGENT_TOOLKIT.md');
    for (const token of ['Codex', 'Antigravity', 'AGENTS.md', '.agents/rules', '.agents/workflows']) {
      expect(docs).toContain(token);
    }
    expect(docs).toContain('Functional parity');
    expect(docs).toContain('Claude-only');
  });

  it('keeps executable toolkit guidance free of Claude marketplace commands', () => {
    const paths = [
      'AGENTS.md',
      '.agents/AGENTS.md',
      '.agents/adapters/codex.md',
      '.agents/adapters/antigravity.md',
      '.agents/rules/core.md',
      '.agents/rules/typescript.md',
      ...workflowNames.map((name) => `.agents/workflows/${name}.md`),
    ];
    for (const path of paths) {
      expect(readRepoFile(path)).not.toMatch(/^\s*\/plugin\s/gm);
    }
  });

  it('keeps every workspace skill discoverable with valid frontmatter', () => {
    const skillsRoot = resolve(repoRoot, '.agents/skills');
    const skillDirectories = readdirSync(skillsRoot).filter((name) =>
      statSync(resolve(skillsRoot, name)).isDirectory(),
    );

    expect(skillDirectories.length).toBeGreaterThan(0);
    const names = skillDirectories.map((directory) => {
      const skillPath = `.agents/skills/${directory}/SKILL.md`;
      expect(existsSync(resolve(repoRoot, skillPath)), `${skillPath} is missing`).toBe(true);
      const content = readRepoFile(skillPath);
      const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      expect(frontmatter, `${skillPath} has invalid frontmatter`).not.toBeNull();
      expect(frontmatter?.[1]).toMatch(/^name:\s*\S+/m);
      expect(frontmatter?.[1]).toMatch(/^description:\s*.+/m);
      return frontmatter?.[1].match(/^name:\s*(.+)$/m)?.[1].trim();
    });

    expect(new Set(names).size).toBe(names.length);
  });

  it('resolves critical cross-platform references', () => {
    const references = [
      '.agents/AGENTS.md',
      '.agents/skills',
      '.agents/adapters/codex.md',
      '.agents/adapters/antigravity.md',
      '.agents/rules/core.md',
      '.agents/rules/typescript.md',
      ...workflowNames.map((name) => `.agents/workflows/${name}.md`),
    ];

    for (const reference of references) {
      expect(existsSync(resolve(repoRoot, reference)), `${reference} is missing`).toBe(true);
    }
  });
});
