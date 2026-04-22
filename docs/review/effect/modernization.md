# Effect Usage Review - Modernization Notes

## What I Would Change Next

### 1. Make `CommandService` a real app service, not a half-hidden platform wrapper

Current state:

- `CommandService` uses `Effect.Service`
- but `execute` still leaks `CommandExecutor`

Target state:

- callers only depend on `CommandService`
- infra dependencies are consumed during service construction

The simplest shape is to mirror the `FsService` approach:

```ts
interface CommandServiceShape {
  readonly make: (cmd: CommandName, ...args: string[]) => StandardCommand
  readonly execute: (command: StandardCommand) => Effect.Effect<string, CommandError>
}
```

This is the cleanest alignment with official "use layers for dependencies"
guidance.

### 2. Prefer exhaustive closed-branch modeling over defect fallbacks

For values such as:

- project type
- preset
- create mode

prefer:

- `Match.exhaustive`
- or an explicit `never` branch

This keeps impossible states encoded in types rather than pushed into runtime
defects.

### 3. Keep sync boundaries explicitly sync

For CLI parsing and similar bootstrapping paths, if the logic is intended to
remain synchronous, the code should say so directly.

Why I prefer this:

- `runMain` remains the single "real runtime" launch point
- preflight parsing stays obviously sync
- future async creep shows up immediately when helpers stop type-fitting

### 4. Consider an `AppLayer` / runtime builder to simplify top-level wiring

`apps/cli/src/index.ts` is already correct on the important part:
`NodeRuntime.runMain(program)`.

What is still noisy is the layer assembly:

- `PlatformLayer`
- `BaseLayer`
- nested `OrchestratorLayer`
- final merge at the program boundary

This is not wrong. Effect layers are memoized, so duplicated composition is
usually more a readability problem than a runtime problem. Still, the entry
module would be easier to reason about if the project exposed one stable
builder such as:

- `AppLayer`
- or `makeCliRuntime(...)`

This is an ergonomics refactor, not a correctness fix.

## What I Would Intentionally Keep

### Keep `CliContext` as contextual data

Do **not** cargo-cult `Effect.Service` everywhere.

`CliContext` is a good example of where the code is already modern:

- it is per-run data
- it has no stable live implementation
- it is closer to a scoped input than an app capability

That is a legitimate `Context.Tag` use.

### Keep the scoped rollback model in `PlanService.apply`

This part is strong:

- `Effect.scoped`
- tracked created paths
- finalizer registered with `Scope.addFinalizerExit`
- cleanup only on failure
- reverse-order cleanup

That is a sound Effect-native answer to rollback semantics. I would not
replace it with manual `try/catch/finally` or process-wide mutable cleanup
state.

### Keep `FsService` unless the team is ready to stop doing domain error mapping

If the team still wants:

- repo-local file errors
- a stable service boundary
- no raw platform service requirement leaking to callers

then `FsService` still earns its keep.

If the team decides it wants a thinner codebase more than a domain-specific
error boundary, then direct `FileSystem` usage could be reconsidered later.
That would be a product/codebase tradeoff, not a correctness fix.

## Optional Future Upgrade

### Revisit the prompt bridge only if you need external cancellation

Current code:

- lifts a Promise-based prompt API with `Effect.promise`
- maps the prompt's cancel sentinel to `Effect.interrupt`

That is fine for today's one-shot interactive CLI.

The only reason to upgrade this would be if you later need:

- timeout-driven prompt cancellation
- fiber interruption that should actively abort the underlying prompt
- integration with an abort/unsubscribe-capable prompt API

At that point, an `Effect.asyncInterrupt`-style bridge becomes more
interesting. Until then, this should stay behind the "nice-to-have" line.

