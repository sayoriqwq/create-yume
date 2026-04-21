# Effect Observability Convention

## Goal

Tracing and logs should describe the same runtime phases with stable names and shared metadata.

## Stable Span Names

- `questions.collect`
- `template.render`
- `plan.build`
- `plan.apply`
- `command.execute`

Project-level wrapper spans may exist around these phases, but the names above are the contract for core runtime operations.

## Required Metadata

When project context is available, annotate logs and spans with:

- `projectName`
- `projectType`
- `taskKind`
- `targetPath`

## Pattern

- Use [`apps/cli/src/core/services/observability.ts`](/Users/sayori/Desktop/create-yume/apps/cli/src/core/services/observability.ts) for project-scoped annotations.
- Add `Effect.withSpan(...)` at the phase boundary.
- Add `Effect.annotateLogs(...)` and `Effect.annotateSpans(...)` once per boundary instead of scattering ad hoc keys through leaf code.
