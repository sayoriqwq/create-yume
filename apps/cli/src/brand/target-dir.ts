import { ParseResult, Schema } from 'effect'

export const TargetDirSchema = Schema.String.pipe(
  Schema.brand('TargetDir'),
  Schema.annotations({
    identifier: 'TargetDir',
    title: 'TargetDir',
  }),
)

export type TargetDir = Schema.Schema.Type<typeof TargetDirSchema>

export const decodeTargetDir = Schema.decodeUnknown(TargetDirSchema, { errors: 'all' })

export const formatTargetDirError = ParseResult.TreeFormatter.formatErrorSync

export const makeTargetDir = (value: string): TargetDir => TargetDirSchema.make(value)
