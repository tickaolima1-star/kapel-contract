# Multi-Agent Review

## Description

Review a change through independent evidence lanes and produce one deduplicated, severity-ranked report.

## Steps

1. Read `.agents/skills/requesting-code-review/SKILL.md` completely and invoke `requesting-code-review`.
2. Define the review range, intended behavior, specification, and verification evidence.
3. When native subagents are available and delegation is authorized, dispatch independent lanes for correctness, security, tests, and maintainability. Give each lane the same diff and prevent cross-lane anchoring.
4. Without authorized subagents, review the same lanes sequentially and keep their notes separate until synthesis.
5. Require every finding to name a file/location, failure scenario, impact, and concrete evidence.
6. Deduplicate overlapping findings, reject unsupported speculation, and rank remaining issues by severity.
7. Present blockers first, then important and minor findings, followed by verification gaps.
8. Do not implement review suggestions until they are technically validated and within the authorized change scope.
