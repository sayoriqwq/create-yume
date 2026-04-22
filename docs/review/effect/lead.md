# Effect Usage Review - Lead

## Summary

This review focused on the repository's current Effect usage, using
`docs/llms/llms.txt` as the chapter index and `docs/llms/llms-full.txt`
as the full reference corpus. I also cross-checked the repo-local
conventions in `docs/conventions/*.md` and `docs/plan/lead.md`.

Review scope:

- 11 production source files under `apps/cli/src`
- 8 reference/convention documents under `docs/`

## Verdict

**COMMENT**

There is no evidence of a high-severity Effect misuse in the core CLI
runtime. The codebase is already on the right side of the current Effect
guidance in the most important places:

- the Node entry uses `NodeRuntime.runMain`
- repo-local services mostly use `Effect.Service`
- dynamically scoped CLI state stays on `Context.GenericTag`
- rollback work is modeled with `Effect.scoped` and finalizers rather than
  ad hoc `try/finally`

The main remaining gap is architectural, not catastrophic:

- 1 medium issue
- 2 low-priority issues

## Severity Snapshot

| Severity | Count | Notes |
| --- | ---: | --- |
| CRITICAL | 0 | No security or data-loss-grade Effect issue found in scope |
| HIGH | 0 | No blocking misuse of runtime, scope, or service model found |
| MEDIUM | 1 | One service leaks infra requirements through its public API |
| LOW | 2 | Two places use weaker-than-ideal modeling for closed branches / sync decoding |

## Stage 1 - Spec Compliance

This section answers your three audit questions directly.

### 1. Is the code hand-writing capabilities that Effect already provides?

**Mostly no.**

The codebase has already moved away from the older
`Context.Tag + Layer.effect` app-service pattern for its main runtime
services. `FsService`, `CommandService`, `TemplateEngineService`,
`PlanService`, and `OrchestratorService` all use `Effect.Service`, which
matches current official guidance.

The main borderline cases are:

- `FsService`: this is a wrapper over `@effect/platform/FileSystem`, but it
  is not pure duplication. It adds domain-level `FileIOError` mapping and
  removes `FileSystem` from consumer signatures by closing over the platform
  implementation.
- `CommandService`: this is a thinner wrapper over `@effect/platform/Command`.
  It adds logging, spans, and domain error mapping, but it still leaks
  `CommandExecutor` through the public method type. This is the closest thing
  in the repo to a partially redundant abstraction.
- `CliContext`: **should not** be migrated to `Effect.Service`. The official
  docs explicitly position `Context.Tag`-style services as the better fit
  when no sensible default exists or when the value is dynamically scoped.

### 2. Does the code follow Effect / functional best practices?

**Broadly yes, with two notable deviations.**

What is already good:

- generator style is used where it improves readability
- runtime execution is confined to the entry module
- resource rollback uses scope/finalizer semantics
- configuration is centralized through `AppConfig`
- repo-local conventions are consistent with current official guidance

Where it falls short:

- `CommandService` exposes an infra requirement in its method signature,
  weakening the service boundary
- some closed union branches fall back to `Effect.dieMessage(...)` instead of
  compile-time exhaustiveness

### 3. Is there a better way to use Effect in this project today?

**Yes, but the better path is incremental, not a rewrite.**

The best next improvements are:

1. Make `CommandService.execute` requirement-free for callers.
2. Replace runtime defect fallbacks on closed unions with exhaustive
   matching or `never` checks.
3. Make synchronous decode paths explicitly synchronous instead of going
   through a generic `Effect` and `runSync`.
4. Optionally simplify top-level layer assembly behind one `AppLayer` or
   `ManagedRuntime` builder once the first three items are done.

## Recommended Reading Order

- [Findings](./findings.md): severity-rated issues with file/line references
- [Modernization](./modernization.md): what I would change next, and what I
  would intentionally keep
- [Evidence](./evidence.md): diagnostics, search evidence, and official doc
  chapters used for this review

