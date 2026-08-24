# TypeScript and React Rule

Activation: Glob

Globs:

- `src/**/*.ts`
- `src/**/*.tsx`
- `tests/**/*.ts`

Requirements:

- Keep TypeScript strict and do not weaken `tsconfig.json` to hide errors.
- Follow the existing `@/*` import alias and repository component patterns.
- Add focused Vitest coverage before implementing behavioral changes.
- Prefer small, typed functions and explicit boundaries over speculative abstractions.
- Avoid unrelated refactors and verify changed behavior before running broader gates.
