# Codex Adapter

This adapter translates the shared contract into Codex-native behavior. It describes capabilities, not fixed tool names: use only facilities exposed by the active Codex environment.

| Portable action | Codex behavior |
| --- | --- |
| Project instructions | Load root `AGENTS.md`, then apply more specific nested instruction files when present. |
| Skill discovery | Inspect `.agents/skills/`; read a relevant `SKILL.md` fully before acting. |
| Task tracking | Use the active plan or task facility for multi-step work and keep statuses current. |
| Subagent dispatch | Use native Codex subagents only when the environment supports them and delegation is authorized. |
| Independent review | Give isolated correctness, security, test, and maintainability lanes the same diff, then deduplicate evidence before reporting. |
| Verification | Run repository commands through the shell and cite fresh exit status and output. |
| Hooks | Replace unsupported Claude hook events with explicit workflow steps, tests, or repository scripts. |

## Guardrails

- Never invent a tool name that is absent from the current Codex session.
- Do not delegate when instructions or the user have not authorized subagents.
- Preserve the sandbox and approval boundaries of the active environment.
- Shared skill instructions govern the method; this adapter only selects native mechanics.
