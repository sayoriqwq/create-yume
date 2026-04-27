# Effect Observability Baseline

Source baseline:

- official Effect tracing guidance

## Official baseline

- Create spans around meaningful runtime phases rather than scattering tracing indiscriminately.
- Keep phase naming deliberate and consistent.
- Prefer boundary-level annotation over ad hoc repeated metadata in leaf calls.
- Treat tracing and related metadata as part of runtime comprehension, not afterthought noise.

## When to apply this

Use this baseline when:

- adding a new runtime phase
- choosing a span name
- deciding which metadata belongs at the phase boundary
- reviewing observability code that is noisy or inconsistent

## Divergence rule

If the current code adds tracing without clear phase boundaries, inconsistent names, or scattered metadata that obscures the runtime story, treat that as a refactor signal.
