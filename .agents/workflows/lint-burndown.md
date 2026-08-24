# Lint Burndown

## Description

Reduce an existing lint backlog incrementally without turning warnings into an unreviewed refactor.

## Steps

1. Confirm that `npm run lint` is configured and non-interactive; if it is not, report the blocker rather than rewriting configuration silently.
2. Capture the exact baseline command, exit code, total findings, rules, and affected directories.
3. Group findings by rule and separate mechanical edits from behavior-changing or architecture-changing fixes.
4. Select one mechanical group with disjoint file ownership and write or identify focused regression checks.
5. Apply only that group, rerun its focused checks, then rerun the lint baseline.
6. Commit the independently verified group before starting another.
7. Request approval before disabling rules, changing rule severity, adding dependencies, or changing runtime behavior.
8. Finish with `verification-before-completion` and report baseline versus final counts.
