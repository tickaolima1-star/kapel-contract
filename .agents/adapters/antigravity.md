# Google Antigravity Adapter

This adapter translates the shared contract into Antigravity-native behavior while keeping portable skill bodies free of platform syntax.

| Portable action | Antigravity behavior |
| --- | --- |
| Project instructions | Load workspace rules from `.agents/rules/` and follow their reference to `.agents/AGENTS.md`. |
| Skill discovery | Discover `.agents/skills/<name>/SKILL.md` progressively and load the relevant skill before acting. |
| Task tracking | Maintain a task artifact for multi-step work and update it after each completed step. |
| Subagent dispatch | Use Antigravity's native subagent facility only when available and authorized; keep writable file ownership disjoint. |
| Repeatable workflow | Invoke `.agents/workflows/<name>.md` as `/workflow-name`. |
| Verification | Run terminal commands and record the command, exit result, and relevant output in the task or walkthrough artifact. |
| Hooks | Prefer explicit workflows and repository checks when an equivalent lifecycle hook is unavailable. |

## Guardrails

- Rules hold persistent constraints; workflows hold ordered, user-invoked procedures.
- Never assume a subagent, browser, or MCP tool is enabled without checking the active session.
- Shared skill instructions govern the method; this adapter only selects native mechanics.
