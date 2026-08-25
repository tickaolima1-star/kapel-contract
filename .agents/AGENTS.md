# KAPEL Shared Agent Contract

This file is the platform-neutral source of truth for repository work. Codex enters through `/AGENTS.md`; Google Antigravity enters through `.agents/rules/`. Reusable methods live in `.agents/skills/`.

## Project stack

- Next.js 14 and React 18 application code in `src/app`.
- TypeScript with strict checking across application and tests.
- Prisma for the local data model and Supabase for hosted data and authentication integration.
- Tailwind CSS for styling and Vitest for automated tests.

## Repository boundaries

- `src/app`: routes, layouts, server handlers, and page composition.
- `src/components`: reusable interface components.
- `src/lib`: business logic, integrations, and framework-independent helpers.
- `prisma`: schema, migrations, and seed data.
- `tests`: Vitest coverage for application behavior and repository contracts.
- `docs`: architecture, specifications, plans, and operator documentation.

Never commit `.env`, `.next`, `*.tsbuildinfo`, or local database state from `prisma/dev.db`. Treat generated output as disposable and preserve unrelated user changes.

- **CRITICAL DATABASE RULE:** NEVER run `--force-reset`, delete tables, or perform any destructive database action. ALWAYS ask the user in ALL CAPS (CAIXA ALTA) if they really want to alter or reset database data before executing any schema push, database write, or reset command.
- **CRITICAL FRONT-END RULE:** Any and all visual/front-end changes MUST strictly adhere to the original KAPEL Design System (colors `#050505` base background, `#0A0A0A` panel background, `#121312` card background, `#1C2E24` military green primary, `#335943` green border, text/contrast helpers `#F2F2ED` and `#AEB4AE`, technical variables styled with mono fonts/scanlines). Never fall back to standard blue/slate styling components.

## Skill-first lifecycle

Inspect `.agents/skills/` before responding or acting.

- New features and behavioral changes: `brainstorming`, then `writing-plans`, then an approved execution skill.
- Bugs, failing tests, or unexpected behavior: `systematic-debugging` before proposing a fix.
- Implementation changes: `test-driven-development` unless the task is documentation-only.
- Reviews: `requesting-code-review` or `receiving-code-review` as appropriate.
- Completion: `verification-before-completion` with fresh evidence.

## Canonical commands

- Install: `npm install`
- Develop: `npm run dev`
- Focused test: `npx vitest run <test-file>`
- Full tests: `npm test`
- Typecheck: `npm run typecheck`
- Build: `npm run build`
- Lint: `npm run lint` only after confirming the existing command is configured and non-interactive.
- Database schema sync: `npm run db:push`
- Database seed: `npm run db:seed`

## Completion evidence

Run the smallest relevant check first, then expand to typecheck, full tests, and build in proportion to risk. Report the exact command and result. If a check fails, determine whether the failure is introduced or pre-existing; never hide or silently skip it.

## Platform adapters

- Codex behavior mapping: `.agents/adapters/codex.md`
- Antigravity behavior mapping: `.agents/adapters/antigravity.md`

Adapters describe native mechanics. They do not override this shared contract or duplicate skill bodies.
