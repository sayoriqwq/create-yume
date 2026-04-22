import { ParseResult, Schema } from 'effect'
import { TemplatePathSchema } from '../brand/template-path'

export const ContributionUnitKindSchema = Schema.Literal(
  'fragment-render',
  'partial-namespace',
  'json-text-mutation',
  'static-asset-copy',
  'post-generate-command',
).annotations({
  identifier: 'ContributionUnitKind',
  title: 'ContributionUnitKind',
})

export const ContributionTraceSchema = Schema.Struct({
  owner: Schema.String,
  unit: ContributionUnitKindSchema,
}).annotations({
  identifier: 'ContributionTrace',
  title: 'ContributionTrace',
})

export type JsonLiteral
  = | string
    | number
    | boolean
    | null
    | readonly JsonLiteral[]
    | { readonly [key: string]: JsonLiteral }

export const JsonLiteralSchema: Schema.Schema<JsonLiteral> = Schema.suspend((): Schema.Schema<JsonLiteral> =>
  Schema.Union(
    Schema.String,
    Schema.Number,
    Schema.Boolean,
    Schema.Null,
    Schema.Array(JsonLiteralSchema),
    Schema.Record({ key: Schema.String, value: JsonLiteralSchema }),
  ),
).annotations({
  identifier: 'JsonLiteral',
  title: 'JsonLiteral',
})

export const PlanOperationSpecSchema = Schema.Struct({
  reducer: Schema.String,
  ownership: Schema.optionalWith(ContributionTraceSchema, { exact: true }),
  input: Schema.optionalWith(JsonLiteralSchema, { exact: true }),
}).annotations({
  identifier: 'PlanOperationSpec',
  title: 'PlanOperationSpec',
})

export const RenderTaskSpecSchema = Schema.Struct({
  kind: Schema.Literal('render'),
  path: Schema.String,
  src: TemplatePathSchema,
  data: Schema.optionalWith(JsonLiteralSchema, { exact: true }),
  ownership: Schema.optionalWith(ContributionTraceSchema, { exact: true }),
}).annotations({
  identifier: 'RenderTaskSpec',
  title: 'RenderTaskSpec',
})

export const CopyTaskSpecSchema = Schema.Struct({
  kind: Schema.Literal('copy'),
  path: Schema.String,
  src: TemplatePathSchema,
  ownership: Schema.optionalWith(ContributionTraceSchema, { exact: true }),
}).annotations({
  identifier: 'CopyTaskSpec',
  title: 'CopyTaskSpec',
})

export const JsonTaskSpecSchema = Schema.Struct({
  kind: Schema.Literal('json'),
  path: Schema.String,
  ownership: Schema.optionalWith(ContributionTraceSchema, { exact: true }),
  readExisting: Schema.optionalWith(Schema.Boolean, { exact: true }),
  sortKeys: Schema.optionalWith(Schema.Boolean, { exact: true }),
  base: Schema.optionalWith(JsonLiteralSchema, { exact: true }),
  reducers: Schema.Array(PlanOperationSpecSchema),
  finalize: Schema.optionalWith(PlanOperationSpecSchema, { exact: true }),
}).annotations({
  identifier: 'JsonTaskSpec',
  title: 'JsonTaskSpec',
})

export const TextTaskSpecSchema = Schema.Struct({
  kind: Schema.Literal('text'),
  path: Schema.String,
  ownership: Schema.optionalWith(ContributionTraceSchema, { exact: true }),
  readExisting: Schema.optionalWith(Schema.Boolean, { exact: true }),
  base: Schema.optionalWith(Schema.String, { exact: true }),
  transforms: Schema.Array(PlanOperationSpecSchema),
}).annotations({
  identifier: 'TextTaskSpec',
  title: 'TextTaskSpec',
})

export const PlanTaskSpecSchema = Schema.Union(
  RenderTaskSpecSchema,
  CopyTaskSpecSchema,
  JsonTaskSpecSchema,
  TextTaskSpecSchema,
).annotations({
  identifier: 'PlanTaskSpec',
  title: 'PlanTaskSpec',
})

export const PlanSpecSchema = Schema.Struct({
  tasks: Schema.Array(PlanTaskSpecSchema),
}).annotations({
  identifier: 'PlanSpec',
  title: 'PlanSpec',
})

export type PlanOperationSpec = Schema.Schema.Type<typeof PlanOperationSpecSchema>
export type ContributionUnitKindSpec = Schema.Schema.Type<typeof ContributionUnitKindSchema>
export type ContributionTraceSpec = Schema.Schema.Type<typeof ContributionTraceSchema>
export type RenderTaskSpec = Schema.Schema.Type<typeof RenderTaskSpecSchema>
export type CopyTaskSpec = Schema.Schema.Type<typeof CopyTaskSpecSchema>
export type JsonTaskSpec = Schema.Schema.Type<typeof JsonTaskSpecSchema>
export type TextTaskSpec = Schema.Schema.Type<typeof TextTaskSpecSchema>
export type PlanTaskSpec = Schema.Schema.Type<typeof PlanTaskSpecSchema>
export type PlanSpec = Schema.Schema.Type<typeof PlanSpecSchema>

export const decodePlanSpec = Schema.decodeUnknown(PlanSpecSchema, { errors: 'all' })

export const formatPlanSpecError = ParseResult.TreeFormatter.formatErrorSync
