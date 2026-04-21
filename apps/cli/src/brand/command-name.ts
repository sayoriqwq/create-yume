import { ParseResult, Schema } from 'effect'

export const CommandNameSchema = Schema.String.pipe(
  Schema.brand('CommandName'),
  Schema.annotations({
    identifier: 'CommandName',
    title: 'CommandName',
  }),
)

export type CommandName = Schema.Schema.Type<typeof CommandNameSchema>

export const decodeCommandName = Schema.decodeUnknown(CommandNameSchema, { errors: 'all' })

export const formatCommandNameError = ParseResult.TreeFormatter.formatErrorSync

export const makeCommandName = (value: string): CommandName => CommandNameSchema.make(value)
