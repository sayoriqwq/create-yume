# Effect Schema Baseline

Source baseline:

- official Effect schema guidance

## Official baseline

- Decode external and cross-layer data at the boundary before business logic relies on it.
- Prefer explicit schema-based decoding rather than silent coercion.
- Convert parse failures into typed, readable failures.
- Keep schemas focused on serializable data contracts.
- Use schema annotations and structure that improve the clarity of diagnostics when the boundary matters.

## When to apply this

Use this baseline when:

- accepting CLI, JSON, disk, or cross-layer input
- defining or extending a contract
- reviewing whether validation is happening too late
- deciding whether a value should remain unvalidated deeper in the system

## Divergence rule

If the current code allows unvalidated external data to flow into business logic, or relies on silent coercion where a contract boundary is expected, treat that as a refactor signal.
