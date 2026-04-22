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

describe('state management ownership boundaries', () => {
  it('routes store file renders through the state-management capability owner', async () => {
    const reactPlan = await Effect.runPromise(buildPlanSpec(reactPresetProjectConfig))
    const vuePlan = await Effect.runPromise(buildPlanSpec(vuePresetProjectConfig))

    expect(reactPlan.tasks).toContainEqual(expect.objectContaining({
      kind: 'render',
      path: 'src/stores/counter.ts',
      ownership: {
        owner: 'state-management',
        unit: 'fragment-render',
      },
    }))

    expect(vuePlan.tasks).toContainEqual(expect.objectContaining({
      kind: 'render',
      path: 'src/stores/counter.ts',
      ownership: {
        owner: 'state-management',
        unit: 'fragment-render',
      },
    }))
  })

  it('omits store renders when state management is disabled', async () => {
    const reactPlan = await Effect.runPromise(buildPlanSpec({
      ...reactPresetProjectConfig,
      stateManagement: 'none',
    }))
    const vuePlan = await Effect.runPromise(buildPlanSpec({
      ...vuePresetProjectConfig,
      stateManagement: false,
    }))

    expect(reactPlan.tasks.some(task => task.path === 'src/stores/counter.ts')).toBe(false)
    expect(vuePlan.tasks.some(task => task.path === 'src/stores/counter.ts')).toBe(false)
  })
})

describe('scaffold-family shared frontend policy', () => {
  it('omits vite-owned files when the build tool is disabled', async () => {
    const reactPlan = await Effect.runPromise(buildPlanSpec({
      ...reactPresetProjectConfig,
      buildTool: 'none',
    }))
    const vuePlan = await Effect.runPromise(buildPlanSpec({
      ...vuePresetProjectConfig,
      buildTool: 'none',
    }))

    for (const plan of [reactPlan, vuePlan]) {
      expect(plan.tasks.some(task => task.path === 'vite.config.ts')).toBe(false)
      expect(plan.tasks.some(task => task.path === 'src/vite-env.d.ts')).toBe(false)
      expect(plan.tasks.some(task => task.path === 'tsconfig.node.json')).toBe(false)
    }
  })
})
