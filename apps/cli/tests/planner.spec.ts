import type { ProjectConfig } from '../src/types/config'
import { Effect, Layer, LogLevel, Option } from 'effect'
import { describe, expect, it } from 'vitest'
import { makeTemplatePath } from '../src/brand/template-path'
import { AppConfig } from '../src/config/app-config'
import { buildPackageJson } from '../src/core/modifier/package-json'
import { buildTemplates } from '../src/core/services/compose'
import { PlanService, toPlanSpec } from '../src/core/services/planner'
import { buildRootSvg } from '../src/core/template-registry/root-svg'
import {
  reactCustomProjectConfig,
  reactPresetProjectConfig,
  vueCustomProjectConfig,
  vuePresetProjectConfig,
} from './support/fixtures'
import { makeFsMockLayer, makeTemplateEngineMockLayer } from './support/mock-layers'

const templateRoot = makeTemplatePath('/virtual/templates')

const plannerLayer = PlanService.DefaultWithoutDependencies.pipe(
  Layer.provideMerge(Layer.mergeAll(
    Layer.succeed(AppConfig, {
      logLevel: LogLevel.Debug,
      defaultConcurrency: 1,
      tracingEndpoint: Option.none(),
      debug: false,
    }),
    makeFsMockLayer(),
    makeTemplateEngineMockLayer(),
  )),
)

function buildPlanSpec(config: ProjectConfig) {
  return Effect.gen(function* () {
    const planner = yield* PlanService
    const plan = yield* planner.build((dsl) => {
      buildRootSvg(dsl, templateRoot)
      buildPackageJson(dsl, config)
      buildTemplates(dsl, templateRoot, config)
    })

    return toPlanSpec(plan)
  }).pipe(Effect.provide(plannerLayer))
}

describe('planner snapshots', () => {
  it.each([
    ['react preset', reactPresetProjectConfig],
    ['vue preset', vuePresetProjectConfig],
    ['react custom', reactCustomProjectConfig],
    ['vue custom', vueCustomProjectConfig],
  ] as const)('builds a deterministic plan for %s', async (_name, config) => {
    const planSpec = await Effect.runPromise(buildPlanSpec(config))

    expect(planSpec).toMatchSnapshot()
  })
})
