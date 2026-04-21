import { ParseResult, Schema } from 'effect'

export const ProjectNameSchema = Schema.String.pipe(
  Schema.brand('ProjectName'),
  Schema.annotations({
    identifier: 'ProjectName',
    title: 'ProjectName',
  }),
)

export type ProjectName = Schema.Schema.Type<typeof ProjectNameSchema>

export const decodeProjectName = Schema.decodeUnknown(ProjectNameSchema, { errors: 'all' })

export const formatProjectNameError = ParseResult.TreeFormatter.formatErrorSync

export const makeProjectName = (value: string): ProjectName => ProjectNameSchema.make(value)
