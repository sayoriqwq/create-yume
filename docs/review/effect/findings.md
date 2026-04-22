# Effect Usage Review - Findings

## Code Review Summary

**Files Reviewed:** 11 production files + 8 reference docs  
**Total Issues:** 3  
**Recommendation:** COMMENT

### By Severity

- CRITICAL: 0
- HIGH: 0
- MEDIUM: 1
- LOW: 2

## Issues

### [MEDIUM] `CommandService` leaks `CommandExecutor` through its public API

**File:** `apps/cli/src/core/services/command.ts:9-12`  
**Implementation:** `apps/cli/src/core/services/command.ts:23-39`

**Issue**

`CommandServiceShape.execute` returns
`Effect.Effect<string, CommandError, CommandExecutor>`. That means the
consumer of `CommandService` still has to carry the platform executor in the
environment, even after the service abstraction has already been introduced.

This conflicts with the official service guidance in Effect: when a service
has dependencies, those dependencies should be handled in the service's
construction layer instead of leaking through the service interface. The
closest official statement is in the "Managing Services" guidance:
dependencies should live in layers, not in method signatures.

**Why this matters**

- the service boundary is weaker than it looks
- downstream code is forced to know about platform execution details
- tests have to mirror infra requirements instead of mocking a clean service
- this makes `CommandService` less "app service" and more "typed helper"

**Fix**

Capture the command executor during service construction, the same way
`FsService` captures `FileSystem.FileSystem`, and expose:

```ts
readonly execute: (command: StandardCommand) => Effect.Effect<string, CommandError>
```

Practical options:

- inject the platform executor in `CommandService` construction and close
  over it
- or make `CommandService` a thin helper module and stop pretending it is a
  dependency-hiding service

The first option is the better Effect-native direction.

---

### [LOW] Closed unions fall back to defects instead of compile-time exhaustiveness

**File:** `apps/cli/src/core/questions/compose.ts:99-129`  
**File:** `apps/cli/src/core/questions/compose.ts:139-171`  
**File:** `apps/cli/src/core/questions/compose.ts:182-189`

**Issue**

`createProject`, `createPreset`, and `collectQuestions` all end with
`Effect.dieMessage("Unsupported ...")` branches. Today those branches are
likely unreachable, but that fact is not enforced by the type system.

Effect's pattern-matching guidance explicitly recommends exhaustiveness for
closed branching. The current code will fail at runtime if a new union member
is added but these branches are not updated.

**Why this matters**

- defects are supposed to model unexpected failures
- these branches are better described as "closed union exhaustiveness"
- future enum/union expansion will produce a runtime crash instead of a
  compile-time reminder

**Fix**

Use one of these:

- `Match.value(value).pipe(..., Match.exhaustive)`
- a `switch` plus `const _exhaustive: never = value`

That keeps the "impossible state" modeling honest and makes the compiler do
the work.

---

### [LOW] Synchronous CLI decoding is expressed through a generic effect + `runSync`

**File:** `apps/cli/src/index.ts:94-96`  
**Related:** `apps/cli/src/core/cli-args.ts:44-49`

**Issue**

The CLI argument decode path is logically synchronous, but it is modeled as a
generic `Effect` and then forced through `Effect.runSync(...)`. This works
today because the schema is sync-only, but the contract is implicit rather
than explicit.

The official docs are clear that `runSync` is for effects that really are
synchronous. If this decode pipeline ever gains an async schema refinement,
async filter, or effectful dependency, the failure mode becomes "blow up at
runtime" rather than "fail to compile or fail the helper contract".

**Why this matters**

- the code is correct today, but brittle to future evolution
- it hides an important invariant: "CLI decode must stay synchronous"
- it makes the boundary between pre-runtime parsing and main program runtime
  less explicit than it could be

**Fix**

Expose a sync decode helper for CLI args and keep that boundary explicit.
Examples:

- a sync schema decoder helper returning `Either`
- a dedicated `parseCliArgsSync(...)`
- or a small comment + helper type that guarantees this effect must remain
  sync-only

This is not urgent, but it is a worthwhile cleanup.

## Non-Issues Worth Calling Out

These are places that might look suspicious at first glance, but I do **not**
recommend flagging them as defects.

### `CliContext` should stay on `Context.GenericTag`

**File:** `apps/cli/src/core/cli-context.ts:1-12`

This is a dynamically scoped value with no sensible default implementation.
That is exactly the case where official guidance favors `Context.Tag`-style
modeling over `Effect.Service`.

### `FsService` is verbose, but it is not pointless duplication

**File:** `apps/cli/src/core/services/fs.ts:25-105`

This wrapper is doing two real jobs:

- translating platform failures into repo-local `FileIOError`
- removing `FileSystem` from consumer signatures by capturing the platform
  implementation once

So while it is noisier than direct `FileSystem` usage, it is not merely
"re-implementing what Effect already ships". This also matches the current
repo plan, which explicitly records that these `provideService(...)` calls are
being intentionally retained for type-safety reasons.

### Prompt cancellation via interruption is conceptually correct

**File:** `apps/cli/src/core/adapters/prompts.ts:5-16`

The bridge uses `Effect.promise(questionFn)` and turns the prompt library's
"cancel sentinel" into `Effect.interrupt`. For a one-shot prompt API, this is
aligned with Effect's interruption model. I would only revisit this if the
project later needs true external cancellation of an in-flight prompt.

## Out-of-Scope but Relevant Baseline Signal

Project-level diagnostics are not fully green today.

- `apps/cli/src/core/cli-args.ts:30` currently reports `TS2375` under
  `exactOptionalPropertyTypes`

That issue is not part of the Effect-specific findings above, but it is worth
tracking separately because it means the repo-level TypeScript baseline is not
fully clean.

