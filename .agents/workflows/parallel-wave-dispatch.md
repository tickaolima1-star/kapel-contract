# Parallel Wave Dispatch

## Description

Organize independent implementation tasks into safe waves with no shared writable files or hidden same-wave dependencies.

## Steps

1. Read `.agents/skills/dispatching-parallel-agents/SKILL.md` completely and invoke `dispatching-parallel-agents`.
2. Extract each task's inputs, outputs, dependencies, writable files, and verification command.
3. Reject any proposed wave where two tasks can write the same file or one task consumes another task's uncommitted output.
4. Order the remaining tasks into the smallest number of dependency-safe waves.
5. Use native subagents only when the platform supports them and delegation is authorized; otherwise execute tasks sequentially in wave order.
6. Give each worker exclusive ownership, the specification, exact interfaces, and completion criteria.
7. Review and verify every task in the current wave before starting the next wave.
8. Synthesize commits and report any ownership or dependency change that invalidates later waves.
