import type { TemplatePath } from '../brand/template-path'
import { ParseResult, Schema } from 'effect'
import { TemplatePathSchema } from '../brand/template-path'

export const TemplateRegistryEntryDeclarationSchema = Schema.Struct({
  target: Schema.String,
  template: TemplatePathSchema,
}).annotations({
  identifier: 'TemplateRegistryEntryDeclaration',
  title: 'TemplateRegistryEntryDeclaration',
})

export type TemplateRegistryEntryDeclaration = Schema.Schema.Type<typeof TemplateRegistryEntryDeclarationSchema>

export type TemplateRegistryCondition<T> = (config: T) => boolean
export type TemplateRegistryTarget<T> = TemplateRegistryEntryDeclaration['target'] | ((config: T) => TemplateRegistryEntryDeclaration['target'])

export interface TemplateRegistryEntry<T> {
  readonly template: TemplatePath
  readonly target: TemplateRegistryTarget<T>
  readonly condition: TemplateRegistryCondition<T>
}

export type TemplateRegistry<T> = Record<string, TemplateRegistryEntry<T>>

export const decodeTemplateRegistryEntryDeclaration = Schema.decodeUnknown(TemplateRegistryEntryDeclarationSchema, { errors: 'all' })

export const formatTemplateRegistryEntryDeclarationError = ParseResult.TreeFormatter.formatErrorSync
