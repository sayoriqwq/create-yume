export type CreateMode = import('effect').Schema.Schema.Type<typeof import('@/schema/preset').CreateModeSchema>
export type Preset = import('effect').Schema.Schema.Type<typeof import('@/schema/preset').PresetSchema>

export type Language = import('effect').Schema.Schema.Type<typeof import('@/schema/project-config').LanguageSchema>
export type Linting = import('effect').Schema.Schema.Type<typeof import('@/schema/project-config').LintingSchema>
export type CodeQuality = import('effect').Schema.Schema.Type<typeof import('@/schema/project-config').CodeQualitySchema>

export type BaseProjectConfig = import('effect').Schema.Schema.Type<typeof import('@/schema/project-config').BaseProjectConfigSchema>
export type BaseFrontendAppConfig = import('effect').Schema.Schema.Type<typeof import('@/schema/project-config').BaseFrontendAppConfigSchema>

export type BuildTool = import('effect').Schema.Schema.Type<typeof import('@/schema/project-config').BuildToolSchema>
export type CSSPreprocessor = import('effect').Schema.Schema.Type<typeof import('@/schema/project-config').CSSPreprocessorSchema>
export type CSSFramework = import('effect').Schema.Schema.Type<typeof import('@/schema/project-config').CSSFrameworkSchema>
export type ReactStateManagement = import('effect').Schema.Schema.Type<typeof import('@/schema/project-config').ReactStateManagementSchema>
export type ReactRouter = import('effect').Schema.Schema.Type<typeof import('@/schema/project-config').ReactRouterSchema>
export type StateManagement = import('effect').Schema.Schema.Type<typeof import('@/schema/project-config').StateManagementSchema>
export type Router = import('effect').Schema.Schema.Type<typeof import('@/schema/project-config').RouterSchema>

export type VueProjectConfig = import('effect').Schema.Schema.Type<typeof import('@/schema/project-config').VueProjectConfigSchema>
export type ReactProjectConfig = import('effect').Schema.Schema.Type<typeof import('@/schema/project-config').ReactProjectConfigSchema>
export type ProjectConfig = import('effect').Schema.Schema.Type<typeof import('@/schema/project-config').ProjectConfigSchema>
