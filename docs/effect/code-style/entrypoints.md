# Effect Entry and Runtime Baseline

Source baseline:

- official Effect code-style guidance on `runMain`
- official Effect guidance on running Effects

## Official baseline

- `runMain` is the primary entry point for running an Effect application on Node.js.
- Runtime execution should stay at the outer boundary of the application.
- Most internal modules should return `Effect` values instead of eagerly running them.
- `runSync` should be used only for work that is intentionally and provably synchronous.
- If an execution boundary may be asynchronous, prefer an async runner instead of forcing a sync one.

## When to apply this

Use this baseline when:

- defining the main application entrypoint
- deciding where Effects are actually executed
- reviewing helper code that might be running Effects too early
- deciding between `runMain`, `runPromise`, and `runSync`

## Divergence rule

If the current code executes Effects away from the outer boundary, or uses a sync runner for work that is not clearly synchronous, treat that as a refactor signal.
