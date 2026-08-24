# KAPEL Core Rule

Activation: Always On

Read and follow @.agents/AGENTS.md as the shared repository contract.

- Inspect `.agents/skills/` before answering or acting and invoke every relevant process skill.
- Preserve unrelated user changes and keep edits inside the requested scope.
- Do not expose secrets, commit generated output, deploy, or modify remote state without authorization.
- Obtain fresh verification evidence before claiming success.
- When a command fails, report it and classify it as introduced or pre-existing; never silently skip it.
