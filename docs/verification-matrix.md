# Verification Matrix

| Task type | Files changed | Minimum verification commands | Notes |
| --- | --- | --- | --- |
| Add or update a template fragment or partial | `apps/cli/templates/fragments/**`, `apps/cli/templates/partials/**`, optionally `apps/cli/src/core/template-registry/*.ts` | `pnpm --filter create-yume test` | Align with Phase 5 snapshot coverage. Template or registry edits should produce intentional planner/render snapshot diffs. |
| Modify planner behavior | `apps/cli/src/core/services/planner.ts`, `apps/cli/src/core/template-registry/*.ts` | `pnpm --filter create-yume test` | Planner snapshots should explain any task-list delta. Build as well when entry wiring or compile-time behavior changes. |
| Modify template engine behavior | `apps/cli/src/core/services/template-engine.ts`, template helper/partial registration code | `pnpm --filter create-yume test` | Phase 5 render snapshots cover the key React, Vue, and shared fragment paths. |
| Modify package-json modifier | `apps/cli/src/core/modifier/package-json.ts` | `pnpm --filter create-yume build` | Generate a preset outside the repo and inspect the produced `package.json` diff when behavior changes. Planner snapshots should stay stable unless plan shape changes. |
| Docs-only change | `docs/**/*.md`, `README.md`, `AGENTS.md` | Human review only | No automated docs linter in this repo; rely on PR review. |
| Build or entry configuration change | `apps/cli/tsdown.config.ts`, `apps/cli/package.json`, root `package.json` | `pnpm --filter create-yume build` | Confirm `apps/cli/dist/index.js` exists, then smoke-run `node apps/cli/dist/index.js`. Run `pnpm verify` before submit when build metadata changes. |
