# KAPEL Cross-Agent Toolkit

This repository contains one Superpowers-based engineering workflow for both Codex and Google Antigravity. It adapts the operating method from the Vibe Coding Toolkit without installing Claude Code or duplicating platform-neutral instructions.

## Directory map

| Path | Responsibility |
| --- | --- |
| `AGENTS.md` | Codex project entrypoint. |
| `.agents/AGENTS.md` | Shared project contract and canonical commands. |
| `.agents/skills/` | Reusable Superpowers and domain skills. |
| `.agents/adapters/` | Native capability mapping for Codex and Antigravity. |
| `.agents/rules/` | Antigravity workspace rules. |
| `.agents/workflows/` | Repeatable Antigravity slash workflows and portable runbooks. |
| `tests/agent-toolkit.test.ts` | Structural compatibility and portability checks. |

## Usage

### Codex

Open the repository normally. Codex reads the root `AGENTS.md`, which points to the shared contract and `.agents/skills/`. Ask for work in natural language or name a skill explicitly when you need a specific process.

### Antigravity

Open the repository as a workspace. Antigravity discovers workspace skills in `.agents/skills`, rules in `.agents/rules`, and workflows in `.agents/workflows`. Use a workflow through its filename as a slash command, such as `/quality-gates`.

## Workflows

| Command | Purpose |
| --- | --- |
| `/brainstorm-to-plan` | Turn an ambiguous request into an approved design and plan. |
| `/project-sanitize` | Audit repository health before proposing cleanup. |
| `/lint-burndown` | Reduce lint findings in measured, reviewable groups. |
| `/multi-agent-review` | Review correctness, security, tests, and maintainability independently. |
| `/parallel-wave-dispatch` | Organize independent tasks without file collisions. |
| `/memory-capture` | Record only durable repository lessons. |
| `/quality-gates` | Collect fresh verification evidence before completion. |

## Compatibility matrix

| Capability | Codex | Antigravity |
| --- | --- | --- |
| Project instructions | Root `AGENTS.md` | `.agents/rules` → shared contract |
| Shared skills | `.agents/skills/<name>/SKILL.md` | `.agents/skills/<name>/SKILL.md` |
| Persistent rules | `AGENTS.md` hierarchy | Workspace rule activation |
| Repeatable workflows | Read as portable runbooks or route through skills | Native `/workflow-name` commands |
| Subagents | Native facility when available and authorized | Native facility when available and authorized |
| Task tracking | Active Codex plan/task facility | Task artifacts |
| Verification | Shell output | Terminal output recorded in artifacts |
| MCP | Use configured Codex MCP tools | Use configured Antigravity MCP tools |
| Memory | Version-controlled project docs | Version-controlled project docs |
| Lifecycle hooks | Explicit workflows, tests, or scripts | Native hooks when available, otherwise workflows/tests/scripts |

## Functional parity

Functional parity means both platforms enforce the same lifecycle and quality outcome: skill routing, brainstorming, written plans, test-first implementation, independent review when authorized, quality gates, and durable memory capture. It does not mean the platforms expose identical commands, tool names, or internal APIs.

Claude-only marketplace commands, plugin namespaces, and hook event schemas are replaced with native rules, workflows, skills, repository tests, and platform adapters. They are not emulated.

## Verification

Run checks from narrowest to broadest:

```powershell
npm run test:agent-toolkit
npm run typecheck
npm test
npm run build
```

Run `npm run lint` only after confirming the existing Next.js lint setup is configured and non-interactive. A failing or unavailable check must be reported explicitly, never silently omitted.

## Maintenance

1. Update `.agents/AGENTS.md` when shared project facts or commands change.
2. Update only the affected file in `.agents/adapters/` when a platform mechanic changes.
3. Keep each workflow focused and below Antigravity's 12,000-character limit.
4. Update `tests/agent-toolkit.test.ts` with every structural contract change.
5. Do not copy entire skill bodies into rules, workflows, or adapters.
