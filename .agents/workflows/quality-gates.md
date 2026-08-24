# Quality Gates

## Description

Collect fresh, proportionate evidence before a completion, merge, or release claim.

## Steps

1. Read `.agents/skills/verification-before-completion/SKILL.md` completely and invoke `verification-before-completion`.
2. Inspect `git status --short` and the relevant diff to confirm scope and preserve user-owned changes.
3. Run the smallest focused tests for changed behavior and fix introduced failures.
4. Run `npm run typecheck` and record its exit result.
5. Run `npm test` and record passed files, passed tests, and failures.
6. Confirm lint is configured and non-interactive before running `npm run lint`; otherwise report it as unavailable.
7. Run `npm run build` for release-level confidence and record environmental blockers separately.
8. Classify every failure as introduced, pre-existing, or environmental using diff and baseline evidence.
9. Make no success claim unless the required gates have fresh supporting output.
