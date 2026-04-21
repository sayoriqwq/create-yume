import type { TemplatePath } from '@/brand/template-path'
import type { ProjectConfig } from '@/types/config'
import type { FileIOError } from '@/types/error'
import * as path from 'node:path'
import { Effect } from 'effect'
import Handlebars from 'handlebars'
import { AppConfig as AppConfigService } from '@/config/app-config'
import { TemplateError } from '@/types/error'
import { FsService } from '~/fs'
import { withProjectAnnotations } from './observability'
import { registerTemplateHelpers } from './template-helpers'

// 1. 注册 helpers、partials
// 2. 注册模板
// 3. 编译 Handlebars 模板
// 4. 渲染 Handlebars 模板
interface TemplateEngineServiceShape {
  readonly registerHelpers: () => Effect.Effect<void, never>
  readonly registerPartials: (dir: TemplatePath, namespace: string) => Effect.Effect<void, FileIOError>
  readonly compile: (
    templatePath: TemplatePath,
    config: ProjectConfig,
  ) => Effect.Effect<Handlebars.TemplateDelegate, TemplateError | FileIOError>
  readonly render: (
    templatePath: TemplatePath,
    data: unknown,
    config: ProjectConfig,
  ) => Effect.Effect<string, TemplateError | FileIOError>
}

export class TemplateEngineService extends Effect.Service<TemplateEngineService>()(
  'TemplateEngineService',
  {
    effect: Effect.gen(function* () {
      const fs = yield* FsService
      const appConfig = yield* AppConfigService

      // 单例，仅在此服务中
      const hb = Handlebars.create()

      const runtimeOptions = (config: ProjectConfig): Handlebars.RuntimeOptions => ({
      // 禁用原型链访问
        allowProtoPropertiesByDefault: false,
        allowProtoMethodsByDefault: false,
        // 注入 @config
        data: { config },
      })

      const registerHelpers = () =>
        Effect.sync(() => {
          registerTemplateHelpers(hb)
        })

      const registerPartials = (dir: TemplatePath, namespace: string) => Effect.gen(function* () {
        const exists = yield* fs.exists(dir)
        if (!exists)
          return

        const files = yield* fs.readDirectory(dir)
        // 加保险：没有 .hbs 文件则不做任何注册
        const hbsFiles = files.filter(name => name.endsWith('.hbs'))
        if (hbsFiles.length === 0)
          return

        yield* Effect.forEach(
          hbsFiles,
          file =>
            Effect.gen(function* () {
              const full = path.join(dir, file)
              const content = yield* fs.readFileString(full)
              const base = file.replace(/\.hbs$/, '')
              yield* Effect.sync(() => {
                hb.registerPartial(`${namespace ? `${namespace}/` : ''}${base}`, content)
              })
            }),
          { concurrency: appConfig.defaultConcurrency },
        )
      })

      const compile = (path: TemplatePath, config: ProjectConfig) =>
        Effect.gen(function* () {
          const source = yield* fs.readFileString(path)

          const compiled = yield* Effect.try({
            try: () => hb.compile(source, { ...runtimeOptions(config) }),
            catch: e =>
              new TemplateError({ message: '模板编译错误', templatePath: path, stage: 'compile', cause: e }),
          })
          return compiled
        })

      const render = (path: TemplatePath, data: unknown, config: ProjectConfig) =>
        Effect.gen(function* () {
          const tpl = yield* compile(path, config)
          const out = yield* Effect.try({
            try: () => tpl(data, { ...runtimeOptions(config) }),
            catch: e =>
              new TemplateError({ message: String(e), templatePath: path, stage: 'render' }),
          })
          return out
        }).pipe(
          Effect.withSpan('template.render'),
          withProjectAnnotations(config, 'template.render', path),
        )

      return {
        registerHelpers,
        registerPartials,
        compile,
        render,
      } satisfies TemplateEngineServiceShape
    }),
    dependencies: [FsService.Default, AppConfigService.Default],
  },
) {}

export const TemplateEngineLive = TemplateEngineService.Default
