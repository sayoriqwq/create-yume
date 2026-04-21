# Effect Scope Convention

## Goal

Resource-like side effects must have an explicit lifecycle boundary.

## Rules

- Prefer `Effect.scoped` when an operation needs rollback or release behavior.
- Register release behavior with `Scope.addFinalizerExit` when cleanup depends on success or failure.
- Do not use `process.chdir` for command execution. Express cwd through `Command.workingDirectory`.
- Track generated paths in write order and clean them in reverse order on failure.
- Cleanup finalizers must swallow cleanup failures after logging, so the original failure remains visible.

## Current Scope

`PlanService.apply` tracks paths created during a plan run in a scoped `Ref`.
If plan application fails, the finalizer removes those created paths in reverse order.
