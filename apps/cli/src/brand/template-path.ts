import { ParseResult, Schema } from 'effect'

export const TemplatePathSchema = Schema.String.pipe(
  Schema.brand('TemplatePath'),
  Schema.annotations({
    identifier: 'TemplatePath',
    title: 'TemplatePath',
  }),
)

export type TemplatePath = Schema.Schema.Type<typeof TemplatePathSchema>

export const decodeTemplatePath = Schema.decodeUnknown(TemplatePathSchema, { errors: 'all' })

export const formatTemplatePathError = ParseResult.TreeFormatter.formatErrorSync

export const makeTemplatePath = (value: string): TemplatePath => TemplatePathSchema.make(value)
