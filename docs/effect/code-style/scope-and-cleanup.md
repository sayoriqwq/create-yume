# Effect Scope and Cleanup Baseline

Source baseline:

- official Effect resource-management guidance on scopes and finalization

## Official baseline

- Use scoped lifecycle control when resources or rollback behavior need deterministic cleanup.
- Keep cleanup logic attached to the resource boundary rather than scattering it across callers.
- Use finalizers when cleanup depends on the outcome of the operation.
- Preserve the original failure instead of letting cleanup failures obscure it.
- Prefer explicit lifecycle modeling over ad hoc mutable cleanup state.

## When to apply this

Use this baseline when:

- acquiring resources that must be released
- writing files or creating paths that may need rollback
- reviewing cleanup paths after failure
- deciding whether mutable global state is hiding a lifecycle problem

## Divergence rule

If the current code manages resource cleanup through ad hoc mutation, distant callers, or cleanup behavior that can hide the original failure, treat that as a refactor signal.
