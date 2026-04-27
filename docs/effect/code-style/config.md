# Effect Config Baseline

Source baseline:

- official Effect configuration guidance

## Official baseline

- Route runtime configuration through an explicit configuration boundary.
- Prefer `Config.*` combinators over ad hoc environment parsing.
- Keep raw configuration parsing at the boundary instead of repeating it downstream.
- Use redaction for sensitive values.
- Pass parsed configuration values through the application rather than re-parsing raw inputs later.

## When to apply this

Use this baseline when:

- adding a runtime config key
- reviewing direct environment access
- deciding where configuration parsing belongs
- handling sensitive configuration values

## Divergence rule

If the current code parses raw environment values outside the configuration boundary, or fails to redact sensitive config, treat that as a refactor signal.
