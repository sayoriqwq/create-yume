import type { ProjectConfig } from '@/types/config'
import type { ComposeDSL } from '@/types/dsl'
import type { FileIOError } from '@/types/error'
import type { TemplateRegistry } from '@/types/template'
import * as path from 'node:path'
import { Context, Effect, Layer } from 'effect'
import Handlebars from 'handlebars'
import { DEFAULT_CONCURRENCY } from '@/constants/effect'
import { TemplateError } from '@/types/error'
import { FsService } from '~/fs'
import { registerTemplateHelpers } from './template-helpers'

// 1. 注册 helpers、partials
// 2. 注册模板
// 3. 编译 Handlebars 模板
// 4. 渲染 Handlebars 模板
interface TemplateEngineService {
  readonly registerHelpers: () => Effect.Effect<void, never>
  readonly registerPartials: (dir: string, namespace: string) => Effect.Effect<void, FileIOError>
  readonly registerTemplates: <T> (dsl: ComposeDSL, templateRoot: string, registry: TemplateRegistry<T>, config: ProjectConfig) => Effect.Effect<void, FileIOError>
  readonly compile: (
    templatePath: string,
    config: ProjectConfig,
  ) => Effect.Effect<Handlebars.TemplateDelegate, TemplateError | FileIOError>
  readonly render: (
    templatePath: string,
    data: unknown,
    config: ProjectConfig,
  ) => Effect.Effect<string, TemplateError | FileIOError>
}

class TemplateEngine extends Context.Tag('TemplateEngine')<
  TemplateEngine,
  TemplateEngineService
>() {}

export const TemplateEngineLive = Layer.effect(
  TemplateEngine,
  Effect.gen(function* () {
    const fs = yield* FsService

    // 模板缓存（似乎并没有意义）
    const cache = new Map<string, Handlebars.TemplateDelegate>()
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

    const registerPartials = (dir: string, namespace: string) => Effect.gen(function* () {
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
        { concurrency: DEFAULT_CONCURRENCY },
      )
    })

    const registerTemplates = <T>(dsl: ComposeDSL, templateRoot: string, registry: TemplateRegistry<T>, config: ProjectConfig) =>
      Effect.gen(function* () {
        for (const item of Object.values(registry)) {
          if (!item.condition(config as T))
            continue
          const target = typeof item.target === 'string' ? item.target : item.target(config as T)
          const src = path.join(templateRoot, item.template)
          dsl.render(src, target)
        }
      })

    const compile = (path: string, config: ProjectConfig) =>
      Effect.gen(function* () {
        const cached = cache.get(path)
        if (cached)
          return cached
        const source = yield* fs.readFileString(path)

        const compiled = yield* Effect.try({
          try: () => hb.compile(source, { ...runtimeOptions(config) }),
          catch: e =>
            new TemplateError({ message: '模板编译错误', templatePath: path, stage: 'compile', cause: e }),
        })
        cache.set(path, compiled)
        return compiled
      })

    const render = (path: string, data: unknown, config: ProjectConfig) =>
      Effect.gen(function* () {
        const tpl = yield* compile(path, config)
        const out = yield* Effect.try({
          try: () => tpl(data, { ...runtimeOptions(config) }),
          catch: e =>
            new TemplateError({ message: String(e), templatePath: path, stage: 'render' }),
        })
        return out
      })

    return TemplateEngine.of({
      registerHelpers,
      registerPartials,
      registerTemplates,
      compile,
      render,
    })
  }),
)

export { TemplateEngine as TemplateEngineService }
