# Cross-Agent Vibe Coding Toolkit — Design

## Objective

Adapt the useful practices from `soumatheusgomes/vibe-coding-toolkit` to this repository so that the same engineering workflow works in both Codex and Google Antigravity, without installing Claude Code or depending on Claude-specific plugin commands.

The result must preserve the existing Superpowers skills, use one shared source of truth whenever the platforms support the same convention, and keep platform-specific adapters small and explicit.

## Success Criteria

- Codex discovers project instructions from a root `AGENTS.md`.
- Antigravity discovers workspace skills, rules, and workflows under `.agents/`.
- Both platforms follow the same lifecycle: brainstorm, specify, plan, implement, review, verify, and finish.
- Existing Superpowers skills remain usable and are not duplicated.
- Ready-made prompts from the source toolkit become reusable skills or workflows instead of copy-and-paste snippets.
- Quality gates use commands that exist in this repository.
- Claude-only commands and assumptions are absent from executable project guidance.
- Structural validation detects broken references, malformed skill metadata, and missing required files.
- Existing user changes remain untouched.

## Non-Goals

- Installing Claude Code or an Anthropic account dependency.
- Reproducing the `/plugin marketplace` command system.
- Installing every optional third-party CLI mentioned by the source toolkit.
- Introducing an external memory database or Obsidian dependency.
- Changing application behavior, UI, database schema, or deployment configuration.
- Claiming byte-for-byte parity where Codex and Antigravity expose different agent APIs.

## Considered Approaches

### 1. Shared core with thin platform adapters — selected

Store portable skills and project knowledge in `.agents/`, then expose them through a root `AGENTS.md` for Codex and rules/workflows for Antigravity. Platform-specific differences remain in short adapter documents.

This minimizes drift, fits the repository's existing structure, and makes improvements available to both agents.

### 2. Codex-first configuration

Use only root `AGENTS.md`, Codex configuration, and Codex-specific skills. This would be simpler but would leave Antigravity without native workflows and activation rules.

### 3. Fully duplicated configurations

Maintain independent Codex and Antigravity copies of every rule and workflow. This provides maximum platform-specific control but creates two sources of truth that can silently diverge.

## Architecture

### Shared layer

`.agents/skills/` remains the canonical home for reusable methods. The existing Superpowers installation stays in place. New skills are added only when a source-toolkit concept has task-specific behavior that is not already covered.

Shared project facts—stack, canonical commands, safety boundaries, and definition of done—live in one concise document under `.agents/`. Platform entrypoints reference this shared content rather than restating it in full.

### Codex adapter

A root `AGENTS.md` acts as the Codex entrypoint. It contains the minimum always-on behavioral rules, the project's canonical commands, skill-routing expectations, and references to shared project guidance.

Codex-native subagents provide the parallel-review and independent-work capabilities described in the source toolkit. The adapter maps abstract actions such as “dispatch an independent reviewer” to Codex subagent tools without embedding tool-call syntax in portable skills.

### Antigravity adapter

`.agents/rules/` contains small workspace rules with appropriate activation modes. Always-on rules cover safety, project commands, and skill-first behavior; model-decided or glob-scoped rules cover specialized work.

`.agents/workflows/` contains invocable workflows for repeatable sequences such as project sanitation, lint burndown, multi-agent review, memory capture, and end-to-end feature delivery.

Antigravity-specific task artifacts and agent invocation mechanics are documented only in its adapter so shared skills remain portable.

## Components

### Project instruction entrypoint

The root `AGENTS.md` will:

- identify `.agents/skills/` as the shared skill catalog;
- require the appropriate process skill before implementation;
- name the canonical install, lint, typecheck, test, build, and development commands;
- define change-scope and verification expectations;
- point to platform-neutral shared guidance;
- avoid duplicating long skill bodies.

### Shared project guide

A compact shared guide will describe:

- Next.js 14, React 18, TypeScript, Prisma, Supabase, Tailwind, and Vitest;
- important directories and ownership boundaries;
- commands supported by `package.json`;
- handling of secrets, generated files, database state, and user-owned changes;
- the required evidence before completion.

### Toolkit-derived workflows

The portable adaptation will cover the source toolkit's useful operational prompts:

- project sanitation;
- ESLint warning burndown;
- multi-agent code review;
- brainstorm-to-plan handoff;
- safe parallel-wave dispatch;
- memory bootstrap and lesson capture;
- quality-gate setup and execution.

If an existing Superpowers skill already provides the behavior, the workflow references it instead of recreating it.

### Quality gates

The repository currently exposes `npm test` and `npm run build`. It declares `npm run lint`, but Next.js 14's lint command and the project's current configuration must be verified during implementation rather than assumed to pass.

The adapter will define progressive gates:

1. focused tests for changed behavior;
2. full Vitest suite;
3. TypeScript validation using the project's compiler configuration;
4. lint when the configured command is operational;
5. production build for release-level confidence.

No new lint stack will be introduced unless validation proves the existing setup is unusable and a separate approved change is warranted.

### Memory

Long-lived project facts remain in version-controlled documentation. Session-specific observations are not promoted automatically. A memory-capture workflow records only durable lessons: non-obvious business rules, expensive debugging discoveries, and recurring repository constraints.

No Obsidian or external MCP dependency is required for the initial adaptation.

## Workflow and Data Flow

1. The platform loads its native entrypoint.
2. The entrypoint supplies project facts and directs the agent to the shared skill catalog.
3. The user's request triggers the relevant process or domain skill.
4. The skill delegates platform-specific actions through the applicable adapter.
5. Implementation follows the approved specification and plan.
6. Quality gates collect command output as completion evidence.
7. A review workflow checks scope, correctness, security, tests, and maintainability.
8. Durable lessons may be promoted to shared project memory after review.

## Error Handling and Safety

- Missing optional tools degrade to documented manual or native-platform alternatives.
- A missing or failing quality command is reported explicitly; it is never silently skipped.
- Destructive commands, global installations, remote writes, and deployments retain normal approval requirements.
- Generated adapters never overwrite an existing file without first inspecting and merging its content.
- References use repository-relative paths and structural validation rejects broken links.
- Platform-specific instructions are labeled to prevent one agent from attempting another agent's tool syntax.
- User-owned uncommitted changes are excluded from toolkit commits.

## Validation Strategy

### Structural checks

- Verify required files and directories exist.
- Parse YAML frontmatter for every added `SKILL.md`.
- Ensure skill names are unique.
- Verify relative file references resolve.
- Search executable guidance for unsupported Claude-only commands.
- Confirm workflow names are unique and suitable for slash invocation.

### Behavioral smoke checks

Use representative prompts to confirm routing expectations:

- an ambiguous feature request routes through brainstorming;
- a defect routes through systematic debugging;
- a behavioral change requires tests and verification;
- a broad review uses independent review lanes when the platform supports them;
- a completion claim includes fresh command evidence.

### Repository verification

Run focused structural tests first, then the existing test suite and production build. Record any pre-existing failure separately from regressions introduced by this adaptation.

## Rollout

The implementation is delivered in small, reviewable groups:

1. shared project guidance and root Codex entrypoint;
2. Antigravity rules and workflows;
3. toolkit-derived portable workflows or skills;
4. validation scripts and tests;
5. documentation and end-to-end verification.

Each group must be independently understandable and must not require installing Claude Code.

## Compatibility Boundary

“Complete adaptation” means functional parity of the workflow, not identical commands or internal APIs. Brainstorming, planning, skill routing, subagent review, quality gates, memory capture, browser/tool integration, and reusable prompts will have native equivalents. Claude marketplace management, Claude hook event schemas, and Claude-specific slash commands will be replaced rather than emulated.

