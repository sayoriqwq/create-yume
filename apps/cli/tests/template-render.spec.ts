import type { ProjectConfig } from '../src/types/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NodeFileSystem } from '@effect/platform-node'
import { Effect, Layer } from 'effect'
import { describe, expect, it } from 'vitest'
import { makeTemplatePath } from '../src/brand/template-path'
import { AppConfig } from '../src/config/app-config'
import { collectPartialEntries } from '../src/core/services/compose'
import { FsLive } from '../src/core/services/fs'
import { TemplateEngineLive, TemplateEngineService } from '../src/core/services/template-engine'
import { makeTestConfigProvider } from './support/config-provider'
import {
  reactCustomProjectConfig,
  reactPresetProjectConfig,
  vueCustomProjectConfig,
  vuePresetProjectConfig,
} from './support/fixtures'

const testsDir = path.dirname(fileURLToPath(import.meta.url))
const templateRoot = path.resolve(testsDir, '../templates')
const partialRoot = path.join(templateRoot, 'partials')

const templateEngineLayer = TemplateEngineLive.pipe(
  Layer.provideMerge(AppConfig.Default),
  Layer.provideMerge(
    FsLive.pipe(
      Layer.provideMerge(NodeFileSystem.layer),
    ),
  ),
)

function renderTemplate(templateRelativePath: string, config: ProjectConfig) {
  return Effect.runPromise(
    Effect.gen(function* () {
      const templateEngine = yield* TemplateEngineService
      yield* templateEngine.registerHelpers()

      for (const entry of collectPartialEntries(config, makeTemplatePath(partialRoot))) {
        yield* templateEngine.registerPartials(entry.dir, entry.namespace)
      }

      return yield* templateEngine.render(
        makeTemplatePath(path.join(templateRoot, templateRelativePath)),
        {},
        config,
      )
    }).pipe(
      Effect.provide(templateEngineLayer),
      Effect.withConfigProvider(makeTestConfigProvider()),
    ),
  )
}

describe('template render snapshots', () => {
  it.each([
    [
      'react main without router',
      'fragments/react/main.tsx.hbs',
      {
        ...reactCustomProjectConfig,
        router: 'none',
      },
    ],
    [
      'react main with react-router',
      'fragments/react/main.tsx.hbs',
      reactPresetProjectConfig,
    ],
    [
      'react main with tanstack router',
      'fragments/react/main.tsx.hbs',
      reactCustomProjectConfig,
    ],
    [
      'vite config for react with tailwind',
      'fragments/common/vite.config.ts.hbs',
      reactPresetProjectConfig,
    ],
    [
      'vite config for vue with tailwind',
      'fragments/common/vite.config.ts.hbs',
      vuePresetProjectConfig,
    ],
    [
      'vite config for vue without tailwind',
      'fragments/common/vite.config.ts.hbs',
      vueCustomProjectConfig,
    ],
    [
      'react shared style without router-specific config branching',
      'fragments/common/css/style.css.hbs',
      {
        ...reactCustomProjectConfig,
        router: 'none',
      },
    ],
    [
      'eslint config for react',
      'fragments/common/linter/eslint.config.mjs.hbs',
      reactPresetProjectConfig,
    ],
    [
      'eslint config for vue',
      'fragments/common/linter/eslint.config.mjs.hbs',
      vuePresetProjectConfig,
    ],
    [
      'vue app with router and state management',
      'fragments/vue/App.vue.hbs',
      vuePresetProjectConfig,
    ],
    [
      'vue app without router and state management',
      'fragments/vue/App.vue.hbs',
      {
        ...vueCustomProjectConfig,
        router: false,
        stateManagement: false,
      },
    ],
  ] as const)('renders %s', async (_name, templateRelativePath, config) => {
    const output = await renderTemplate(templateRelativePath, config)

    expect(output).toMatchSnapshot()
  })
})
