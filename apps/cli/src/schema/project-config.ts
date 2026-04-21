import { ParseResult, Schema } from 'effect'
import { ProjectNameSchema } from '../brand/project-name'

export const ProjectTypeSchema = Schema.Literal('vue', 'react').annotations({
  identifier: 'ProjectType',
  title: 'ProjectType',
})

export const BaseFrontendAppTypeSchema = Schema.Literal('vue', 'react').annotations({
  identifier: 'BaseFrontendAppType',
  title: 'BaseFrontendAppType',
})

export const BuildToolSchema = Schema.Literal('vite', 'none').annotations({
  identifier: 'BuildTool',
  title: 'BuildTool',
})

export const CSSPreprocessorSchema = Schema.Literal('css', 'less', 'sass').annotations({
  identifier: 'CSSPreprocessor',
  title: 'CSSPreprocessor',
})

export const CSSFrameworkSchema = Schema.Literal('tailwind', 'none').annotations({
  identifier: 'CSSFramework',
  title: 'CSSFramework',
})

export const ReactStateManagementSchema = Schema.Literal('zustand', 'jotai', 'none').annotations({
  identifier: 'ReactStateManagement',
  title: 'ReactStateManagement',
})

export const ReactRouterSchema = Schema.Literal('react-router', 'tanstack-router', 'none').annotations({
  identifier: 'ReactRouter',
  title: 'ReactRouter',
})

export const LanguageSchema = Schema.Literal('typescript', 'javascript').annotations({
  identifier: 'Language',
  title: 'Language',
})

export const LintingSchema = Schema.Literal('antfu-eslint', 'none').annotations({
  identifier: 'Linting',
  title: 'Linting',
})

export const CodeQualitySchema = Schema.Literal('lint-staged', 'commitlint').annotations({
  identifier: 'CodeQuality',
  title: 'CodeQuality',
})

export const RouterSchema = Schema.Union(ReactRouterSchema, Schema.Boolean).annotations({
  identifier: 'Router',
  title: 'Router',
})

export const StateManagementSchema = Schema.Union(ReactStateManagementSchema, Schema.Boolean).annotations({
  identifier: 'StateManagement',
  title: 'StateManagement',
})

const baseProjectConfigFields = {
  name: ProjectNameSchema,
  language: LanguageSchema,
  git: Schema.Boolean,
  linting: LintingSchema,
  codeQuality: Schema.Array(CodeQualitySchema),
}

const baseFrontendAppConfigFields = {
  ...baseProjectConfigFields,
  type: BaseFrontendAppTypeSchema,
  buildTool: BuildToolSchema,
  router: RouterSchema,
  stateManagement: StateManagementSchema,
  cssPreprocessor: CSSPreprocessorSchema,
  cssFramework: CSSFrameworkSchema,
}

export const BaseProjectConfigSchema = Schema.Struct(baseProjectConfigFields).annotations({
  identifier: 'BaseProjectConfig',
  title: 'BaseProjectConfig',
})

export const BaseFrontendAppConfigSchema = Schema.Struct(baseFrontendAppConfigFields).annotations({
  identifier: 'BaseFrontendAppConfig',
  title: 'BaseFrontendAppConfig',
})

export const VueProjectConfigSchema = Schema.Struct({
  ...baseFrontendAppConfigFields,
  type: Schema.Literal('vue'),
  router: Schema.Boolean,
  stateManagement: Schema.Boolean,
}).annotations({
  identifier: 'VueProjectConfig',
  title: 'VueProjectConfig',
})

export const ReactProjectConfigSchema = Schema.Struct({
  ...baseFrontendAppConfigFields,
  type: Schema.Literal('react'),
  router: ReactRouterSchema,
  stateManagement: ReactStateManagementSchema,
}).annotations({
  identifier: 'ReactProjectConfig',
  title: 'ReactProjectConfig',
})

export const ProjectConfigSchema = Schema.Union(
  VueProjectConfigSchema,
  ReactProjectConfigSchema,
).annotations({
  identifier: 'ProjectConfig',
  title: 'ProjectConfig',
})

export type ProjectType = Schema.Schema.Type<typeof ProjectTypeSchema>
export type BaseFrontendAppType = Schema.Schema.Type<typeof BaseFrontendAppTypeSchema>
export type BuildTool = Schema.Schema.Type<typeof BuildToolSchema>
export type CSSPreprocessor = Schema.Schema.Type<typeof CSSPreprocessorSchema>
export type CSSFramework = Schema.Schema.Type<typeof CSSFrameworkSchema>
export type ReactStateManagement = Schema.Schema.Type<typeof ReactStateManagementSchema>
export type ReactRouter = Schema.Schema.Type<typeof ReactRouterSchema>
export type Language = Schema.Schema.Type<typeof LanguageSchema>
export type Linting = Schema.Schema.Type<typeof LintingSchema>
export type CodeQuality = Schema.Schema.Type<typeof CodeQualitySchema>
export type Router = Schema.Schema.Type<typeof RouterSchema>
export type StateManagement = Schema.Schema.Type<typeof StateManagementSchema>
export type BaseProjectConfig = Schema.Schema.Type<typeof BaseProjectConfigSchema>
export type BaseFrontendAppConfig = Schema.Schema.Type<typeof BaseFrontendAppConfigSchema>
export type VueProjectConfig = Schema.Schema.Type<typeof VueProjectConfigSchema>
export type ReactProjectConfig = Schema.Schema.Type<typeof ReactProjectConfigSchema>
export type ProjectConfig = Schema.Schema.Type<typeof ProjectConfigSchema>

export const decodeBaseProjectConfig = Schema.decodeUnknown(BaseProjectConfigSchema, { errors: 'all' })
export const decodeVueProjectConfig = Schema.decodeUnknown(VueProjectConfigSchema, { errors: 'all' })
export const decodeReactProjectConfig = Schema.decodeUnknown(ReactProjectConfigSchema, { errors: 'all' })
export const decodeProjectConfig = Schema.decodeUnknown(ProjectConfigSchema, { errors: 'all' })

export const formatBaseProjectConfigError = ParseResult.TreeFormatter.formatErrorSync
export const formatVueProjectConfigError = ParseResult.TreeFormatter.formatErrorSync
export const formatReactProjectConfigError = ParseResult.TreeFormatter.formatErrorSync
export const formatProjectConfigError = ParseResult.TreeFormatter.formatErrorSync
