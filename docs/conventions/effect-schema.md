# Effect Schema Conventions

## Decode boundaries

Decode external or cross-layer inputs before business logic uses them:

- CLI flags parsed from `mri`
- JSON loaded from disk or process input
- Question flow results before orchestration continues
- Serializable snapshots that cross a persistence or test boundary

## Failure policy

- Use `Schema.decodeUnknown(...)` at the boundary.
- Convert parse failures into a typed `Effect.fail(...)`.
- Format human-readable diagnostics with `TreeFormatter`.
- Do not silently coerce, default, or fall back after a failed contract decode.

## Authoring rules

- Prefer `Schema.Struct`, `Schema.Union`, and `Schema.Literal` for domain contracts.
- Keep schemas limited to serializable data. Closures stay as plain TypeScript types.
- Add `identifier` / `title` annotations when a schema should produce readable parse errors.
- Use `Schema.optionalWith(..., { exact: true })` for optional fields when `undefined` should not be accepted as an explicit payload value.

## Example

```ts
import { Effect, ParseResult, Schema } from 'effect'

const ExampleSchema = Schema.Struct({
  mode: Schema.Literal('create', 'preset'),
}).annotations({ identifier: 'Example', title: 'Example' })

const decodeExample = (input: unknown) =>
  Schema.decodeUnknown(ExampleSchema, { errors: 'all' })(input).pipe(
    Effect.mapError(error => ({
      schema: 'Example',
      message: ParseResult.TreeFormatter.formatErrorSync(error),
    })),
  )
```
