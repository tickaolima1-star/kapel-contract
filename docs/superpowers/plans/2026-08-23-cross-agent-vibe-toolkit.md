# Cross-Agent Vibe Coding Toolkit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one repository-local engineering toolkit that gives Codex and Google Antigravity equivalent Superpowers-based workflows without requiring Claude Code.

**Architecture:** Keep portable knowledge and skills in `.agents/`, expose a concise root `AGENTS.md` to Codex, and add Antigravity-native rules and workflows under `.agents/rules/` and `.agents/workflows/`. Validate the contract with a focused Vitest suite that treats the Markdown configuration as executable project infrastructure.

**Tech Stack:** Markdown, Agent Skills (`SKILL.md`), Codex `AGENTS.md`, Google Antigravity Rules/Workflows, TypeScript 5.5, Vitest 1.6, Node.js filesystem APIs.

## Global Constraints

- Do not install Claude Code or require an Anthropic account.
- Do not reproduce or emit executable `/plugin marketplace` commands.
- Keep `.agents/skills/` as the shared skill catalog; do not duplicate existing Superpowers skills.
- Do not install optional third-party CLIs, Obsidian, or an external memory database.
- Do not change application behavior, UI, database schema, or deployment configuration.
- Preserve every pre-existing uncommitted user change and stage only task-owned files.
- Functional workflow parity is required; identical platform commands or internal APIs are not.
- Missing or failing quality commands must be reported explicitly and never silently skipped.

## File Map

- Create `AGENTS.md`: Codex entrypoint and concise project-level operating contract.
- Modify `.agents/AGENTS.md`: shared project guide used by both adapters.
- Create `.agents/adapters/codex.md`: maps portable actions to Codex facilities.
- Create `.agents/adapters/antigravity.md`: maps portable actions to Antigravity facilities.
- Create `.agents/rules/core.md`: Antigravity always-on project constraints.
- Create `.agents/rules/typescript.md`: TypeScript/React glob-scoped expectations.
- Create `.agents/workflows/*.md`: repeatable toolkit workflows.
- Create `tests/agent-toolkit.test.ts`: structural and portability contract tests.
- Modify `package.json`: add canonical `typecheck` and toolkit-validation scripts.
- Create `docs/AGENT_TOOLKIT.md`: operator guide and compatibility matrix.

---

### Task 1: Shared Contract and Codex Entrypoint

**Files:**
- Create: `AGENTS.md`
- Modify: `.agents/AGENTS.md`
- Create: `tests/agent-toolkit.test.ts`

**Interfaces:**
- Consumes: existing skill directories under `.agents/skills/<skill-name>/SKILL.md`; existing scripts from `package.json`.
- Produces: root instruction entrypoint `AGENTS.md`; shared contract `.agents/AGENTS.md`; test helper `readRepoFile(relativePath: string): string`.

- [ ] **Step 1: Write the failing entrypoint tests**

Create `tests/agent-toolkit.test.ts`:

```ts
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
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npx vitest run tests/agent-toolkit.test.ts`

Expected: FAIL because root `AGENTS.md` does not exist and `.agents/AGENTS.md` lacks the complete shared project contract.

- [ ] **Step 3: Create the minimal root Codex entrypoint**

Create `AGENTS.md` with these exact sections and requirements:

```markdown
# KAPEL Agent Instructions

Read `.agents/AGENTS.md` for the shared project contract and inspect `.agents/skills/` before acting.

## Required lifecycle

- New behavior: `brainstorming` → `writing-plans` → an approved execution skill.
- Bugs or unexpected behavior: `systematic-debugging` before fixes.
- Behavior changes: `test-driven-development`.
- Completion claims: `verification-before-completion` with fresh command output.
- Use subagents only when the active platform supports them and the user or applicable instructions authorize delegation.

## Canonical verification

Run focused tests first, then `npm run typecheck`, `npm test`, and `npm run build` in proportion to risk. Treat `npm run lint` as optional until its existing configuration has been verified non-interactive.

## Safety

Preserve user-owned changes. Do not install global tools, deploy, modify remote state, or perform destructive actions without the required approval.
```

- [ ] **Step 4: Expand the shared project guide**

Replace `.agents/AGENTS.md` with focused sections for:

- project stack: Next.js 14, React 18, TypeScript, Prisma, Supabase, Tailwind, Vitest;
- canonical commands copied from `package.json`;
- `src/app`, `src/components`, `src/lib`, `prisma`, `tests`, and `docs` responsibilities;
- skill-first routing using the exact skill names in Step 1;
- secrets and generated-file boundaries (`.env`, `.next`, `*.tsbuildinfo`, `prisma/dev.db`);
- completion evidence and handling of pre-existing failures;
- links to `.agents/adapters/codex.md` and `.agents/adapters/antigravity.md`, marked as adapters created in Task 2.

- [ ] **Step 5: Run the focused test and verify it passes**

Run: `npx vitest run tests/agent-toolkit.test.ts`

Expected: PASS with 2 tests.

- [ ] **Step 6: Commit the shared contract**

```bash
git add AGENTS.md .agents/AGENTS.md tests/agent-toolkit.test.ts
git commit -m "feat: add shared agent project contract"
```

---

### Task 2: Native Platform Adapters and Antigravity Rules

**Files:**
- Create: `.agents/adapters/codex.md`
- Create: `.agents/adapters/antigravity.md`
- Create: `.agents/rules/core.md`
- Create: `.agents/rules/typescript.md`
- Modify: `tests/agent-toolkit.test.ts`

**Interfaces:**
- Consumes: shared lifecycle and commands from `.agents/AGENTS.md`.
- Produces: adapter vocabulary for `task tracking`, `subagent dispatch`, `review isolation`, `skill loading`, and `completion evidence`; Antigravity workspace rules.

- [ ] **Step 1: Add failing adapter and portability tests**

Append to the existing `describe` block:

```ts
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
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npx vitest run tests/agent-toolkit.test.ts`

Expected: FAIL with missing adapter and rule files.

- [ ] **Step 3: Write the Codex adapter**

Create `.agents/adapters/codex.md` with a mapping table covering:

- tasks → the current Codex plan/task facility when available;
- skills → `.agents/skills/<name>/SKILL.md` discovery;
- subagents → native Codex subagents only when authorized;
- independent review lanes → separate subagents with deduplicated synthesis;
- verification → shell command evidence;
- project instructions → root `AGENTS.md` plus nested overrides;
- unsupported Claude hooks → explicit workflow steps or repository scripts.

State that adapter text describes capabilities and must not invent unavailable tool names.

- [ ] **Step 4: Write the Antigravity adapter and rules**

Create `.agents/adapters/antigravity.md` mapping:

- tasks → task artifacts;
- skills → `.agents/skills/<name>/SKILL.md`;
- subagents → Antigravity native subagent facility when available and authorized;
- rules → `.agents/rules/`;
- workflows → `.agents/workflows/<name>.md` and `/workflow-name` invocation;
- verification → terminal output recorded in the walkthrough/task artifact.

Create `.agents/rules/core.md` as a plain Markdown rule labeled `Activation: Always On`, reference `@.agents/AGENTS.md`, and keep only safety, skill-first routing, change scope, and verification rules.

Create `.agents/rules/typescript.md` labeled `Activation: Glob` with globs `src/**/*.ts`, `src/**/*.tsx`, and `tests/**/*.ts`. Require strict TypeScript, existing aliases, focused Vitest coverage, and no unrelated refactors.

- [ ] **Step 5: Run the focused test and verify it passes**

Run: `npx vitest run tests/agent-toolkit.test.ts`

Expected: PASS with 4 tests.

- [ ] **Step 6: Commit the native adapters**

```bash
git add .agents/adapters .agents/rules tests/agent-toolkit.test.ts
git commit -m "feat: add Codex and Antigravity adapters"
```

---

### Task 3: Portable Toolkit Workflows

**Files:**
- Create: `.agents/workflows/brainstorm-to-plan.md`
- Create: `.agents/workflows/project-sanitize.md`
- Create: `.agents/workflows/lint-burndown.md`
- Create: `.agents/workflows/multi-agent-review.md`
- Create: `.agents/workflows/parallel-wave-dispatch.md`
- Create: `.agents/workflows/memory-capture.md`
- Create: `.agents/workflows/quality-gates.md`
- Modify: `tests/agent-toolkit.test.ts`

**Interfaces:**
- Consumes: exact skill names from `.agents/skills/`; canonical commands from `.agents/AGENTS.md`; adapter actions from Task 2.
- Produces: seven slash-invocable Antigravity workflows that remain readable as portable runbooks in Codex.

- [ ] **Step 1: Add failing workflow contract tests**

Append at module scope:

```ts
const workflowNames = [
  'brainstorm-to-plan',
  'project-sanitize',
  'lint-burndown',
  'multi-agent-review',
  'parallel-wave-dispatch',
  'memory-capture',
  'quality-gates',
] as const;
```

Append inside `describe`:

```ts
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
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npx vitest run tests/agent-toolkit.test.ts`

Expected: FAIL because `.agents/workflows/` does not contain the seven files.

- [ ] **Step 3: Implement the lifecycle workflows**

Create each workflow with `# <Title>`, `## Description`, and numbered `## Steps`:

- `brainstorm-to-plan.md`: invoke `brainstorming`; require approved design and written spec; invoke `writing-plans`; stop before implementation until the plan is accepted.
- `multi-agent-review.md`: invoke `requesting-code-review`; define correctness, security, tests, and maintainability lanes; use native subagents only when authorized; synthesize and deduplicate findings by severity and evidence.
- `parallel-wave-dispatch.md`: invoke `dispatching-parallel-agents`; calculate file ownership and dependencies; reject any wave with shared writable files; verify each wave before the next.
- `quality-gates.md`: invoke `verification-before-completion`; run focused tests, `npm run typecheck`, `npm test`, and `npm run build`; run lint only after confirming it is non-interactive; distinguish regressions from pre-existing failures.

- [ ] **Step 4: Implement the maintenance workflows**

Create:

- `project-sanitize.md`: measure git status, tests, typecheck, build, secrets exposure, generated files, dependency health, and dead code; separate mechanical changes from decisions requiring approval; make no cleanup during the audit phase.
- `lint-burndown.md`: capture the exact lint baseline; group findings by rule and directory; fix one mechanical group at a time; run focused verification; require approval before behavior-changing or architecture-changing fixes.
- `memory-capture.md`: extract only durable business rules, expensive debugging lessons, and recurring constraints; propose the smallest target document; show the diff; never store secrets or transient session narration.

- [ ] **Step 5: Run the focused test and verify it passes**

Run: `npx vitest run tests/agent-toolkit.test.ts`

Expected: PASS with 6 tests.

- [ ] **Step 6: Commit the workflow library**

```bash
git add .agents/workflows tests/agent-toolkit.test.ts
git commit -m "feat: add portable agent workflows"
```

---

### Task 4: Canonical Commands, Documentation, and Full Structural Validation

**Files:**
- Modify: `package.json`
- Create: `docs/AGENT_TOOLKIT.md`
- Modify: `tests/agent-toolkit.test.ts`

**Interfaces:**
- Consumes: all configuration created in Tasks 1–3.
- Produces: `npm run typecheck`; `npm run test:agent-toolkit`; operator documentation and compatibility matrix.

- [ ] **Step 1: Add failing documentation and command tests**

Append inside `describe`:

```ts
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
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npx vitest run tests/agent-toolkit.test.ts`

Expected: FAIL because the new package scripts and operator guide do not exist.

- [ ] **Step 3: Add the canonical package scripts**

Add to `package.json` without changing existing script values:

```json
"typecheck": "tsc --noEmit",
"test:agent-toolkit": "vitest run tests/agent-toolkit.test.ts"
```

- [ ] **Step 4: Write the operator guide**

Create `docs/AGENT_TOOLKIT.md` with:

- purpose and directory map;
- setup-free usage in Codex and Antigravity;
- workflow invocation table;
- compatibility matrix for instructions, skills, rules, workflows, subagents, tasks, hooks, MCP, and memory;
- “Functional parity” definition;
- Claude-only features that were replaced, not emulated;
- canonical verification commands;
- maintenance procedure: update shared guidance first, adapters second, tests last.

- [ ] **Step 5: Run focused and full structural tests**

Run: `npm run test:agent-toolkit`

Expected: PASS with 9 tests.

Run: `npm run typecheck`

Expected: PASS with exit code 0. If it exposes a pre-existing application failure, record the exact output and verify `tests/agent-toolkit.test.ts` itself has no TypeScript error.

- [ ] **Step 6: Commit commands and documentation**

```bash
git add package.json docs/AGENT_TOOLKIT.md tests/agent-toolkit.test.ts
git commit -m "docs: document cross-agent toolkit usage"
```

---

### Task 5: Repository-Level Verification and Handoff

**Files:**
- Verify only: all task-owned files from Tasks 1–4.

**Interfaces:**
- Consumes: toolkit configuration and package scripts.
- Produces: fresh verification evidence and an explicit list of any pre-existing failures.

- [ ] **Step 1: Inspect scope before verification**

Run: `git status --short`

Expected: only pre-existing user changes remain unstaged; no unrelated file is staged.

Run: `git diff --check HEAD~4..HEAD`

Expected: no whitespace errors in toolkit commits. If the number of created commits differs because a task required a fix commit, use the first toolkit implementation commit as the range start.

- [ ] **Step 2: Run toolkit tests**

Run: `npm run test:agent-toolkit`

Expected: PASS with 9 tests.

- [ ] **Step 3: Run TypeScript validation**

Run: `npm run typecheck`

Expected: PASS. If it fails, classify each failure as introduced or pre-existing using the task diff; fix introduced failures before continuing.

- [ ] **Step 4: Run the full test suite**

Run: `npm test`

Expected: PASS. Any failure must be reported with its test file and exact error; do not call the toolkit complete if the adaptation caused it.

- [ ] **Step 5: Run the production build**

Run: `npm run build`

Expected: PASS. If environment-only services or secrets block the build, report the missing requirement and preserve the successful structural, type, and unit-test evidence separately.

- [ ] **Step 6: Review the final diff and documentation links**

Run: `git diff --stat HEAD~4..HEAD`

Run: `git status --short`

Expected: implementation touches only agent configuration, toolkit tests, `package.json`, and toolkit documentation; pre-existing user changes remain present and uncommitted.

- [ ] **Step 7: Produce the handoff**

Report:

- what Codex loads automatically;
- what Antigravity loads automatically and which `/workflow-name` commands are available;
- verification commands and observed results;
- compatibility boundaries;
- unchanged pre-existing worktree files.

