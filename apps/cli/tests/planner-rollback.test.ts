import type { Plan } from '../src/types/task'
import { Effect, Exit, Layer, LogLevel, Option } from 'effect'
import { describe, expect, it } from 'vitest'
import { makeTargetDir } from '../src/brand/target-dir'
import { makeTemplatePath } from '../src/brand/template-path'
import { AppConfig } from '../src/config/app-config'
import { PlanService } from '../src/core/services/planner'
import { FileIOError } from '../src/types/error'
import { reactProjectConfig } from './support/fixtures'
import { makeFsMockLayer, makeTemplateEngineMockLayer } from './support/mock-layers'

describe('planner rollback', () => {
  it('removes created paths when plan application fails', async () => {
    const writes: string[] = []
    const removes: string[] = []
    const baseDir = makeTargetDir('/tmp/create-yume-rollback')
    const failedPath = `${baseDir}/fail.txt`

    const fsLayer = makeFsMockLayer({
      writeFileString: (path, content) => {
        if (path === failedPath) {
          return Effect.fail(new FileIOError({
            op: 'write',
            path,
            message: 'forced write failure',
          }))
        }

        return Effect.sync(() => {
          writes.push(`${path}:${content}`)
        })
      },
      remove: path =>
        Effect.sync(() => {
          removes.push(path)
        }),
    })

    const templateLayer = makeTemplateEngineMockLayer({
      render: (_templatePath, data) => Effect.succeed(String(data)),
    })

    const appConfigLayer = Layer.succeed(AppConfig, {
      logLevel: LogLevel.Debug,
      defaultConcurrency: 1,
      tracingEndpoint: Option.none(),
      debug: false,
    })

    const layer = PlanService.DefaultWithoutDependencies.pipe(
      Layer.provideMerge(Layer.mergeAll(appConfigLayer, fsLayer, templateLayer)),
    )

    const plan: Plan = {
      tasks: [
        { kind: 'render', src: makeTemplatePath('/tmp/ok.hbs'), path: 'ok.txt', data: 'ok' },
        { kind: 'render', src: makeTemplatePath('/tmp/fail.hbs'), path: 'fail.txt', data: 'fail' },
      ],
    }

    const exit = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const planner = yield* PlanService
        yield* planner.apply(plan, baseDir, reactProjectConfig)
      }).pipe(Effect.provide(layer)),
    )

    expect(Exit.isFailure(exit)).toBe(true)
    expect(writes).toEqual([`${baseDir}/ok.txt:ok`])
    expect(removes).toEqual([`${baseDir}/ok.txt`])
  })
})
