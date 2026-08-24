# Project Sanitize

## Description

Audit repository health with measurements before proposing cleanup. The audit phase is read-only and separates safe mechanical work from decisions that can change behavior or architecture.

## Steps

1. Capture `git status --short` and identify user-owned changes that must remain untouched.
2. Inspect package scripts, TypeScript configuration, ignore rules, test layout, and generated-output directories.
3. Run focused checks, `npm run typecheck`, `npm test`, and `npm run build`; record exact results.
4. Check tracked files for exposed secrets, local database state, build output, and generated artifacts without printing secret values.
5. Measure dependency warnings, unused files, duplicated logic, and lint findings; do not estimate severity without evidence.
6. Classify findings as mechanical, behavior-sensitive, architecture-sensitive, security-sensitive, or external-state work.
7. Present a prioritized remediation proposal. Obtain approval before applying behavior, architecture, dependency, or remote-state changes.
