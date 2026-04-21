# Effect Brand Conventions

## Brand factory location

Brand schemas live in `apps/cli/src/brand/`, one file per domain identifier:

- `project-name.ts`
- `target-dir.ts`
- `template-path.ts`
- `package-name.ts`
- `command-name.ts`

Each brand module exports:

- the schema
- a `decode...` function for effectful boundary decoding
- a `make...` helper for trusted internal construction

## Consumer inventory

Current branded consumption points:

- `ProjectConfigSchema.name` and `CliArgsSchema.name` use `ProjectName`
- `generateProject`, `finishProject`, and `OrchestratorService.execute` use `TargetDir`
- template registries, template composition, and template engine entrypoints use `TemplatePath`
- package.json generation uses `PackageName`
- command construction uses `CommandName`

## Boundary rules

- External inputs must become branded through `decode...`, not `as` casts.
- Trusted internal composition may use `make...` only at an injection boundary.
- Do not pass bare `string` values across a branded boundary once a brand exists for that concept.
- Do not store closures or mutable service state inside brand modules.

## Prohibited patterns

- Casting `string as ProjectName`
- Reintroducing `string`-typed command or template path parameters after a brand exists
- Skipping decode after a question flow or flag parse because the source "should already be valid"
