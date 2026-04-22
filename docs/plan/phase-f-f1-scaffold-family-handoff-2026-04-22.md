# Phase F F1 - Scaffold-Family Contract Consumption Handoff

## Status

- Date: 2026-04-22
- Slice: `F1` only
- Result: `DONE`
- Scope kept: shared frontend policy consumption only
- Explicit non-goals kept: no `F2`, no third capability owner, no preserved-core rewrite, no new contribution unit

## Gates 1-3 reconfirmed on this migration branch

### Gate 1 - `CommandService.execute` boundary closure
- Still holds in `apps/cli/src/core/services/command.ts`
- Regression remains in `apps/cli/src/core/services/command.test.ts`
- Meaning for F1: shared frontend migration did not reopen command/executor leakage

### Gate 2 - planner path ownership guardrail
- Still holds in `apps/cli/src/core/services/planner.ts`
- Regression remains in `apps/cli/tests/planner-rollback.test.ts`
- Meaning for F1: template-registry reshaping did not reopen duplicate-path behavior

### Gate 3 - runtime/config semantic boundary cleanup
- Still holds in `apps/cli/src/schema/project-config.ts`
- Regression remains in `apps/cli/tests/project-config.schema.test.ts`
- Meaning for F1: shared frontend config still contains only shared semantics; router/state semantics remain framework-local

## What landed

### 1. Scaffold-Family contract now has an explicit consumption seam

The shared frontend contract now lives in `apps/cli/src/core/template-registry/frontend-app.ts` and is consumed from three places:

- `sharedFrontendQuestionContracts`
  - consumed by:
    - `apps/cli/src/core/questions/frontend/build-tool.ts`
    - `apps/cli/src/core/questions/frontend/css-preprocessor.ts`
    - `apps/cli/src/core/questions/frontend/css-framework.ts`
- `getSharedFrontendPresetDefaults`
  - consumed by `apps/cli/src/core/questions/compose.ts`
- `sharedFrontendTemplates` + `assembleFrontendFamilyTemplates`
  - consumed by:
    - `apps/cli/src/core/template-registry/react.ts`
    - `apps/cli/src/core/template-registry/vue.ts`

### 2. Shared frontend policy is now actually consumed, not only named

`buildTool` is no longer just a question/schema field. The shared frontend template contract now gates:

- `vite.config.*`
- `src/vite-env.d.ts`
- `tsconfig.node.json`

When `buildTool === 'none'`, those Vite-owned files are omitted.

`cssPreprocessor` and `cssFramework` remain consumed through:

- shared style target selection
- `global/import-root-css` partial
- shared Vite/Tailwind template branching

### 3. `commonTemplates` accidental ownership is removed

The old mixed `commonTemplates` bag no longer exists.

It was replaced with explicit slices:

- `sharedFrontendTemplates`
- `workspaceBootstrapTemplates`
- `assembleFrontendFamilyTemplates(...)`

This keeps the policy split visible without forcing F2 into this branch.

## Accidental ownership removed in F1

### Removed
- frontend leaf question modules no longer own option tables or prompt copy
- `compose.ts` no longer hard-codes shared frontend preset defaults
- `react.ts` / `vue.ts` no longer spread a mixed `commonTemplates` sink

### Reduced
- shared frontend template policy is no longer hidden behind a name that also carried workspace/bootstrap entries

## Remain-vs-leave decisions intentionally preserved

### Remain
- `react.ts` / `vue.ts` remain family-local assembly surfaces
- family-local React/Vue entries remain local to their own registries
- capability slots from router/state-management owners remain untouched

### Leave for F2
- workspace/bootstrap template entries still exist in `apps/cli/src/core/template-registry/frontend-app.ts`
- the split is now explicit as `workspaceBootstrapTemplates`, but the actual F2 migration is not started here
- `package.json`, install/git/code-quality/bootstrap commands were intentionally not touched

### Leave outside this slice
- global partial namespace registration still flows through `apps/cli/src/core/services/compose.ts`
- this was not reopened because F1 was constrained to question/schema/template-registry/template surfaces

## Tests added or updated

- `apps/cli/src/core/questions/frontend/shared-frontend.test.ts`
  - proves leaf question modules delegate to Scaffold-Family contract data
- `apps/cli/src/core/template-registry/frontend-app.test.ts`
  - proves preset defaults live in one contract
  - proves shared frontend templates are separate from workspace bootstrap templates
  - proves Vite-owned files are gated by `buildTool`
- `apps/cli/src/core/questions/compose.test.ts`
  - proves preset config consumes shared frontend defaults from the contract
- `apps/cli/tests/planner.spec.ts`
  - proves `buildTool: 'none'` omits Vite-owned files from the plan

## Fresh verification evidence

- `pnpm verify`
  - build: passed
  - tests: passed (`17` files, `60` tests)
  - lint: passed
- Verification date: 2026-04-22

## F2 handoff

The next slice should start from this exact boundary:

1. Treat F1 as complete; do not reopen shared frontend option/default/template ownership unless a regression proves it necessary.
2. Move only workspace/bootstrap policy next:
   - `git`
   - `linting`
   - `codeQuality`
   - package bootstrap policy
   - workspace-owned config renders
   - post-generate commands
3. Keep `frontend-app.ts` shared frontend slice intact; only peel the explicit `workspaceBootstrapTemplates` side during F2.
4. Do not move partial namespace registration into F2 unless the touched consumer surface is explicitly approved.
5. Reconfirm Gates 1-3 again before any F2 edits if the branch head changes.

## Files changed in F1

- `apps/cli/src/core/questions/frontend/build-tool.ts`
- `apps/cli/src/core/questions/frontend/css-preprocessor.ts`
- `apps/cli/src/core/questions/frontend/css-framework.ts`
- `apps/cli/src/core/questions/compose.ts`
- `apps/cli/src/core/template-registry/frontend-app.ts`
- `apps/cli/src/core/template-registry/react.ts`
- `apps/cli/src/core/template-registry/vue.ts`
- `apps/cli/src/core/questions/frontend/shared-frontend.test.ts`
- `apps/cli/src/core/template-registry/frontend-app.test.ts`
- `apps/cli/src/core/questions/compose.test.ts`
- `apps/cli/tests/planner.spec.ts`
