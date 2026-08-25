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
- **CRITICAL DATABASE RULE:** NEVER run `--force-reset`, delete tables, or perform any destructive database action. ALWAYS ask the user in ALL CAPS (CAIXA ALTA) if they really want to alter or reset database data before executing any schema push, database write, or reset command.
- **CRITICAL FRONT-END RULE:** Any and all visual/front-end changes MUST strictly adhere to the original KAPEL Design System (colors `#050505` base background, `#0A0A0A` panel background, `#121312` card background, `#1C2E24` military green primary, `#335943` green border, text/contrast helpers `#F2F2ED` and `#AEB4AE`, technical variables styled with mono fonts/scanlines). Never fall back to standard blue/slate styling components.
