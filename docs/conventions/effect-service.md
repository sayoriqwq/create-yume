# Effect Service Convention

## Goal

All repo-local services use one declaration template.

## Template

```ts
export class ExampleService extends Effect.Service<ExampleService>()('ExampleService', {
  effect: Effect.gen(function* () {
    return {
      run: () => Effect.void,
    }
  }),
  dependencies: [],
}) {}

export const ExampleLive = ExampleService.Default
```

## Rules

- Prefer `Effect.Service` over hand-written `Context.Tag + Layer.effect`.
- Keep the public service shape in a local `*Shape` type when the implementation is non-trivial.
- Use `dependencies` to document construction-time requirements.
- Export `*.Default` as the repo-local live layer alias when existing call sites benefit from a stable name.

## Current Scope

The core runtime services now follow this pattern:

- `FsService`
- `CommandService`
- `TemplateEngineService`
- `PlanService`
- `OrchestratorService`
