# Create Yume Agent Contract

This repository currently supports `react` and `vue` project scaffolds. `node` is declared in planning language, but the CLI does not implement a Node project flow yet.

## Unsupported Scope

- Remote templates
- Plugin system / pluggable template sources
- Incremental CLI updates against an existing project

## Allowed Modification Areas

- `apps/cli/src/`
- `apps/cli/templates/`
- `docs/`

Repo-level metadata needed to keep those areas working, such as root verification config, may be updated when the task explicitly calls for it.

## High-Risk Areas

These files affect plan generation or render behavior across the CLI and require targeted verification:

- `apps/cli/src/core/services/planner.ts`
- `apps/cli/src/core/services/template-engine.ts`
- `apps/cli/src/core/modifier/package-json.ts`

## CLI Entry Convention

- Build artifact: `apps/cli/dist/index.js`
- Package entry fields: `apps/cli/package.json` `main` and `bin.create-yume` must both point to `dist/index.js`
- Keep README examples and smoke commands aligned with that filename

## Template And Registry Convention

- Templates live under `apps/cli/templates/`
- Renderable fragments live under `apps/cli/templates/fragments/**`
- Handlebars partials live under `apps/cli/templates/partials/**`
- Template registry modules live under `apps/cli/src/core/template-registry/*.ts`
- Registry entries reference template paths relative to the template root, for example `fragments/react/App.tsx.hbs`

## Minimum Verification

- Use [docs/verification-matrix.md](./docs/verification-matrix.md) to pick the minimum verification set for the files you changed
- Mixed code/docs changes: `pnpm verify`
- Code-only baseline: `pnpm verify:code`
- Docs-only changes: human review only; no automated docs linter in this repo

## Commit Messages

- Use conventional commits
- Use the lobe-commit workflow for authoring commit messages
- Preferred command: `pnpm commit`
