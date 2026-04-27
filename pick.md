# Pick

This file preserves the small set of long-lived facts worth carrying forward before deleting stale planning, review, archive, and legacy workflow artifacts.

## Product scope that must remain true

- `create-yume` currently supports **React** and **Vue** scaffold generation only.
- Explicit non-goals remain: Node scaffold flow, remote templates, plugin/template source systems, and incremental updates against an existing project.
- The active package is `apps/cli`, and the CLI entry artifact is `apps/cli/dist/index.js`.

## Architecture facts worth preserving

### Preserved execution core

The refactor intentionally preserves these deep modules and behaviors instead of rewriting them:

- `PlanService`
- `PlanSpec`
- `TemplateEngineService`
- `FsService`
- rollback semantics in plan application

Rationale: current tests, generated-project behavior, and code structure all rely on this execution core being stable while decision ownership is restructured around it.

### Ownership-oriented architecture is the active direction

The repository has already moved beyond pure stage-oriented planning. The architecture direction worth preserving is:

1. Preserved Core
2. Scaffold-Family Owner
3. Workspace/Bootstrap Owner
4. Capability Owner

This is not speculative future design; ownership traces and owner definitions are already present in code.

### Contribution units are the stable composition model

The durable contribution model is:

- fragment render
- partial namespace
- JSON/text mutation
- static asset copy
- post-generate command

These are the unit types worth keeping in mind when interpreting template registry ownership, package mutations, and bootstrap behavior.

## Completed boundary work that should not be re-litigated without new evidence

### Command boundary closure

`CommandService.execute` has already been pulled behind the service boundary so callers depend on `CommandService`, not the platform executor requirement.

### Planner duplicate-path protection

The planner now rejects duplicate target-path conflicts before plan application begins. This safety property is regression-tested and should be treated as part of the core execution contract.

### Config semantic cleanup

Shared frontend config now contains only genuinely shared semantics. React and Vue router/state semantics are modeled separately rather than being treated as a fake shared union.

## F1 state that is already landed

The following F1 outcomes are already in the codebase and should be treated as current reality:

- shared frontend question contracts were centralized
- shared frontend preset defaults were centralized
- shared frontend templates were separated from workspace/bootstrap templates
- `buildTool` now gates Vite-owned files such as `vite.config.*`, `src/vite-env.d.ts`, and `tsconfig.node.json`

This means the repository is not at a pre-migration state. It is already in a later-stage ownership refactor with at least one meaningful convergence slice landed.

## Capability-owner reality check

The docs once framed `router` as the single initial pilot owner. Current code reality is further along:

- `router` is implemented as a capability owner
- `state-management` is also implemented as a capability owner

Any future planning should start from implemented reality, not from the earlier pilot-only wording.

## Deep-module rationale worth preserving

A few architectural judgments from older review material are still useful:

- `TemplateEngineService` is directionally a strong deep module and should continue to absorb template-runtime complexity rather than leaking it upward.
- `FsService` remains justified as long as the repo wants a project-local file error boundary instead of raw platform errors.
- `PlanSpec` is a valuable serialization and snapshot boundary; it is part of why planner behavior is testable and inspectable.
- rollback modeled with scoped cleanup and tracked created paths is a good pattern worth preserving.

## Stable verification expectations

The current minimum verification contract that should survive the cleanup is:

- template / partial / registry changes → `pnpm --filter create-yume test`
- planner behavior changes → `pnpm --filter create-yume test`
- `package.json` composition changes → `pnpm --filter create-yume build` plus generated output inspection
- mixed runtime/template/config changes → `pnpm verify`

## Documentation posture after cleanup

After this cleanup, the repository should treat these as the durable homes for truth:

- `.gsd/PROJECT.md` for current project state
- `.gsd/DECISIONS.md` for durable decisions
- `.gsd/REQUIREMENTS.md` for the capability contract
- `docs/` only for stable, current, descriptive documentation

Legacy process artifacts, phase plans, archived review trails, and `.omx` workflow residue should no longer be treated as current documentation.
