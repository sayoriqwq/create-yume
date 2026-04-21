import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NodeFileSystem } from '@effect/platform-node'
import { ConfigProvider, Effect, Layer } from 'effect'
import { describe, expect, it } from 'vitest'
import { makeProjectName } from '@/brand/project-name'
import { makeTemplatePath } from '@/brand/template-path'
import { AppConfig } from '@/config/app-config'
import { FsLive } from '~/fs'
import { TemplateEngineLive, TemplateEngineService } from './template-engine'

describe('templateEngineService', () => {
  it('renders global partials from the explicit global namespace directory', async () => {
    const partialRoot = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../../templates/partials',
    )
    const templatePath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../../templates/fragments/vue/main.ts.hbs',
    )

    const templateEngineLayer = TemplateEngineLive.pipe(
      Layer.provideMerge(AppConfig.Default),
      Layer.provideMerge(
        FsLive.pipe(
          Layer.provideMerge(NodeFileSystem.layer),
        ),
      ),
    )

    const output = await Effect.runPromise(
      Effect.gen(function* () {
        const templateEngine = yield* TemplateEngineService
        yield* templateEngine.registerHelpers()
        yield* templateEngine.registerPartials(makeTemplatePath(path.join(partialRoot, 'global')), 'global')
        return yield* templateEngine.render(
          makeTemplatePath(templatePath),
          {},
          {
            type: 'vue',
            name: makeProjectName('phase2-vue'),
            language: 'typescript',
            git: true,
            linting: 'antfu-eslint',
            codeQuality: ['commitlint'],
            buildTool: 'vite',
            router: false,
            stateManagement: false,
            cssPreprocessor: 'css',
            cssFramework: 'none',
          },
        )
      }).pipe(
        Effect.provide(templateEngineLayer),
        Effect.withConfigProvider(ConfigProvider.fromMap(new Map())),
      ),
    )

    expect(output).toContain(`import './style.css'`)
    expect(output).not.toContain(`import router from './router'`)
    expect(output).toContain(`createApp(App)`)
  })
})
