# Effect Composition Baseline

Source baseline:

- official Effect guidance on generators
- official Effect guidance on pipelines
- official Effect guidance on dual APIs
- official Effect code-style guidance against tacit usage when it harms readability

## Official baseline

- Prefer `Effect.gen` for sequential effectful logic, especially when local variables, branching, or structured control flow improve readability.
- Prefer `pipe(...)` with data-last operators for readable transformation pipelines.
- Data-first style is acceptable when there is only a single operation and `pipe` would add unnecessary noise.
- Avoid tacit / point-free style when it makes the control flow less obvious.
- Choose the style that keeps the flow of data and effects easiest to read.

## When to apply this

Use this baseline when:

- deciding between `Effect.gen` and a pipeline
- deciding between data-first and data-last forms of a dual API
- refactoring nested effectful logic
- reviewing code that has become concise at the expense of readability

## Divergence rule

If the current code is hard to read because it is overly tacit, overly nested, or uses a less readable API form, treat that as a refactor signal.
