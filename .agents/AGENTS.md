# Superpowers Methodology & Rules

This project is equipped with the **Superpowers** agentic skills framework (`obra/superpowers`).

## Core Rules & Workflow

1. **Skill First**: Before acting or answering, check if a relevant skill exists in `.agents/skills/`.
2. **Process Priority**:
   - For new feature development / specs: invoke `brainstorming` -> `writing-plans` -> `executing-plans` (or `subagent-driven-development`).
   - For debugging: invoke `systematic-debugging`.
   - For changes requiring tests: enforce `test-driven-development`.
   - Before completing tasks: invoke `verification-before-completion`.
3. **Quality & Verification**:
   - Always run verification commands before declaring success.
   - Do not skip tests or produce unverified code changes.
