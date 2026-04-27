# Effect Service Baseline

Source baseline:

- official Effect guidance on managing services

## Official baseline

- Model application capabilities as services when they represent reusable dependencies with a meaningful implementation boundary.
- Prefer service construction patterns that keep dependencies inside the service boundary rather than leaking them through public APIs.
- Use contextual tags for dynamic context-like values rather than pretending they are stable application services.
- Keep service interfaces explicit and small enough to communicate the capability boundary clearly.

## When to apply this

Use this baseline when:

- deciding whether something should be a service
- deciding whether something is contextual input instead of a service
- reviewing whether a public API leaks lower-level infrastructure details

## Divergence rule

If the current code exposes infrastructure requirements through a service boundary that should hide them, or models dynamic context as if it were a stable service, treat that as a refactor signal.
