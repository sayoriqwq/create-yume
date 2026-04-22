# Effect Usage Review - Evidence

## Official Reference Set Used

Primary repo docs:

- `docs/llms/llms.txt`
- `docs/llms/llms-full.txt`

Repo-local conventions:

- `docs/conventions/effect-service.md`
- `docs/conventions/effect-scope.md`
- `docs/conventions/effect-config.md`
- `docs/conventions/effect-testing.md`
- `docs/conventions/effect-observability.md`
- `docs/plan/lead.md`

## Official Effect Chapters Mapped To This Review

The following chapters from the embedded Effect corpus were the main basis
for judgment:

- [Guidelines](https://effect.website/docs/code-style/guidelines/)
  Key point used here: `runMain` is the preferred Node entry point, and
  tacit / point-free style is not favored.
- [Using Generators](https://effect.website/docs/getting-started/using-generators/)
  Key point used here: `Effect.gen` is the concise, recommended way to write
  sequential effectful logic.
- [Managing Services](https://effect.website/docs/requirements-management/services/)
  Key point used here: service dependencies should be handled through
  provisioning rather than leaking through public APIs.
- [Effect.Service vs Context.Tag](https://effect.website/docs/requirements-management/services/)
  Key point used here: `Effect.Service` is best for app services with a
  sensible default implementation; `Context.Tag` is better for contextual or
  dynamically scoped values.
- [Scope](https://effect.website/docs/resource-management/scope/)
  Key point used here: `Effect.scoped`, `Effect.acquireRelease`, and
  finalizers are the correct building blocks for lifecycle and rollback work.
- [Pattern Matching](https://effect.website/docs/code-style/pattern-matching/)
  Key point used here: exhaustive branch handling should be enforced where
  unions are closed.
- [Introduction to Runtime](https://effect.website/docs/runtime/)
  Key point used here: `run*` helpers execute via the runtime and should
  respect sync/async boundaries honestly.

## Repository Files Inspected

Production code inspected in detail:

- `apps/cli/src/index.ts`
- `apps/cli/src/core/cli-context.ts`
- `apps/cli/src/core/adapters/prompts.ts`
- `apps/cli/src/core/questions/compose.ts`
- `apps/cli/src/config/app-config.ts`
- `apps/cli/src/core/services/tracing.ts`
- `apps/cli/src/core/services/observability.ts`
- `apps/cli/src/core/services/fs.ts`
- `apps/cli/src/core/services/command.ts`
- `apps/cli/src/core/services/template-engine.ts`
- `apps/cli/src/core/services/planner.ts`

Support and baseline files inspected:

- `apps/cli/src/core/cli-args.ts`
- `apps/cli/src/schema/cli-args.ts`
- `apps/cli/tests/support/make-app-runtime.ts`
- `apps/cli/tests/support/mock-layers.ts`

## Diagnostics Run

Per-file diagnostics were run on the main Effect-heavy production files. All
of the following returned zero TypeScript errors:

- `apps/cli/src/index.ts`
- `apps/cli/src/core/services/fs.ts`
- `apps/cli/src/core/services/command.ts`
- `apps/cli/src/core/services/template-engine.ts`
- `apps/cli/src/core/services/planner.ts`
- `apps/cli/src/core/adapters/prompts.ts`
- `apps/cli/src/core/questions/compose.ts`
- `apps/cli/src/config/app-config.ts`
- `apps/cli/src/core/services/tracing.ts`
- `apps/cli/src/core/cli-context.ts`

Project-level diagnostics on `apps/cli/` reported one unrelated error:

- `apps/cli/src/core/cli-args.ts:30`
- `TS2375`
- cause: `exactOptionalPropertyTypes` mismatch in object construction

## Pattern Searches Run

### AST search

I attempted AST-based searches for:

- `console.log(...)`
- empty `catch`
- hardcoded `apiKey`
- `Context.Tag(...)`
- `Layer.effect(...)`
- `Effect.provideService(...)`

The `ast-grep` backend is not installed in this environment, so AST queries
were unavailable.

### Fallback grep search

I used grep-based fallbacks against `apps/cli/src`.

Observed results:

- no hardcoded `apiKey = "..."` matches in production source
- no empty `catch {}` blocks in production source
- `console.log(...)` appears only in the raw CLI help/version path in
  `apps/cli/src/index.ts`, not in the Effect service layer
- `Effect.provideService(...)` appears in `FsService`
- `Effect.promise(...)` appears in the prompt adapter
- `Effect.dieMessage(...)` appears in `core/questions/compose.ts`

## Why Some Suspicions Were Not Escalated

### `FsService` repeated `provideService(...)`

This looked like a possible cleanup target at first glance, but the repo's
own plan docs explicitly record that the author chose to retain this pattern
for type-safety reasons. Combined with the fact that the service adds
domain-level error mapping, I treated it as intentional design, not a defect.

### `CliContext` not using `Effect.Service`

This is actually a positive signal, not technical debt. It matches the
official "use `Context.Tag` when no sensible default exists" guidance.

### Scoped rollback in `PlanService`

This matches the official lifecycle model closely enough that I treated it as
one of the stronger Effect integrations in the repository.

