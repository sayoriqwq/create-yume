import type { TargetDir } from '@/brand/target-dir'
import type {
  JsonLiteral,
  PlanOperationSpec,
  PlanSpec,
} from '@/schema/plan-spec'
// 提供一个小型 DSL 来声明如何生成/编辑文件。
import type { ProjectConfig } from '@/types/config'
import type { ComposeDSL, JsonBuilder, TextBuilder } from '@/types/dsl'
import type { TemplateError } from '@/types/error'
import type { JsonTask, Plan, Task, TextTask } from '@/types/task'
import * as path from 'node:path'
import { Effect, Exit, Ref, Schema, Scope } from 'effect'
import { produce } from 'immer'
import { makeTargetDir } from '@/brand/target-dir'
import { makeTemplatePath } from '@/brand/template-path'
import { AppConfig as AppConfigService } from '@/config/app-config'
import { FileIOError } from '@/types/error'
import { sortJsonKeys } from '@/utils/file-helper'
import { FsService } from '~/fs'
import { TemplateEngineService } from '~/template-engine'
import { safeParseJson } from '../adapters/json'
import { withProjectAnnotations } from './observability'

const planOperationSpecSymbol = Symbol('planOperationSpec')

type JsonReducer = JsonTask['reducers'][number] & {
  readonly [planOperationSpecSymbol]?: PlanOperationSpec
}

type TextTransform = TextTask['transforms'][number] & {
  readonly [planOperationSpecSymbol]?: PlanOperationSpec
}

function annotateOperation<T extends (...args: any[]) => any>(fn: T, spec: PlanOperationSpec): T {
  Object.defineProperty(fn, planOperationSpecSymbol, {
    value: spec,
    enumerable: false,
    configurable: false,
    writable: false,
  })
  return fn
}

function getOperationSpec(fn: ((...args: any[]) => unknown) | undefined, fallbackName: string): PlanOperationSpec | undefined {
  if (!fn) {
    return undefined
  }

  const spec = (fn as JsonReducer | TextTransform)[planOperationSpecSymbol]
  if (spec) {
    return spec
  }

  return {
    reducer: fn.name || fallbackName,
  }
}

function isJsonLiteral(value: unknown): value is JsonLiteral {
  if (value === null) {
    return true
  }

  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean':
      return true
    case 'object':
      if (Array.isArray(value)) {
        return value.every(isJsonLiteral)
      }
      return Object.values(value).every(isJsonLiteral)
    default:
      return false
  }
}

function toJsonLiteral(value: unknown): JsonLiteral | undefined {
  return isJsonLiteral(value) ? value : undefined
}

export function toPlanSpec(plan: Plan): PlanSpec {
  return {
    tasks: plan.tasks.map((task) => {
      switch (task.kind) {
        case 'render': {
          const data = task.data === undefined ? undefined : toJsonLiteral(task.data)
          return {
            kind: 'render',
            path: task.path,
            src: makeTemplatePath(task.src),
            ...(data !== undefined ? { data } : {}),
          }
        }
        case 'copy':
          return {
            kind: 'copy',
            path: task.path,
            src: makeTemplatePath(task.src),
          }
        case 'json': {
          const base = task.base ? toJsonLiteral(task.base()) : undefined
          const finalize = getOperationSpec(task.finalize, 'finalize')
          return {
            kind: 'json',
            path: task.path,
            ...(task.readExisting !== undefined ? { readExisting: task.readExisting } : {}),
            ...(task.sortKeys !== undefined ? { sortKeys: task.sortKeys } : {}),
            ...(base !== undefined ? { base } : {}),
            reducers: task.reducers.map((reducer) => {
              const spec = getOperationSpec(reducer, 'modify')
              return spec ?? { reducer: 'modify' }
            }),
            ...(finalize ? { finalize } : {}),
          }
        }
        case 'text': {
          const base = task.base?.()
          return {
            kind: 'text',
            path: task.path,
            ...(task.readExisting !== undefined ? { readExisting: task.readExisting } : {}),
            ...(base !== undefined ? { base } : {}),
            transforms: task.transforms.map((transform) => {
              const spec = getOperationSpec(transform, 'transform')
              return spec ?? { reducer: 'transform' }
            }),
          }
        }
        default: {
          const exhaustive: never = task
          return exhaustive
        }
      }
    }),
  }
}

interface PlanServiceShape {
  // 组合 tasks 但是不触发
  readonly build: (
    program: (dsl: ComposeDSL) => void,
  ) => Effect.Effect<Plan, never>
  // 执行计划中的所有任务
  readonly apply: (
    plan: Plan,
    baseDir: TargetDir,
    config: ProjectConfig,
  ) => Effect.Effect<void, FileIOError | TemplateError>
}

export class PlanService extends Effect.Service<PlanService>()('PlanService', {
  effect: Effect.gen(function* () {
    const fs = yield* FsService
    const templates = yield* TemplateEngineService
    const appConfig = yield* AppConfigService

    const build: PlanServiceShape['build'] = program =>
      Effect.sync<Plan>(() => {
        const tasks: Task[] = []

        const json: ComposeDSL['json'] = (path) => {
          const task: JsonTask = { kind: 'json', path, reducers: [], readExisting: undefined, sortKeys: undefined }
          tasks.push(task)
          const builder: JsonBuilder = {
            readExisting(flag) {
              task.readExisting = flag
              return builder
            },
            sortKeys(flag) {
              task.sortKeys = flag
              return builder
            },
            base(fn) {
              task.base = fn
              return builder
            },
            merge(patch) {
              const input = typeof patch === 'function' ? undefined : toJsonLiteral(patch)
              const reducer = annotateOperation((draft: Record<string, unknown>) => {
                const obj = typeof patch === 'function' ? patch(draft) : patch
                Object.assign(draft, obj)
              }, {
                reducer: typeof patch === 'function' ? patch.name || 'merge' : 'merge',
                ...(input !== undefined ? { input } : {}),
              })
              task.reducers.push(reducer)
              return builder
            },
            modify(fn) {
              task.reducers.push(annotateOperation(fn, {
                reducer: fn.name || 'modify',
              }))
              return builder
            },

            finalize(fn) {
              task.finalize = annotateOperation(fn, {
                reducer: fn.name || 'finalize',
              })
              return builder
            },

          }
          return builder
        }

        const text: ComposeDSL['text'] = (path) => {
          const task: TextTask = { kind: 'text', path, transforms: [], readExisting: undefined }
          tasks.push(task)
          const builder: TextBuilder = {
            readExisting(flag) {
              task.readExisting = flag
              return builder
            },
            base(fn) {
              task.base = fn
              return builder
            },
            transform(fn) {
              task.transforms.push(annotateOperation(fn, {
                reducer: fn.name || 'transform',
              }))
              return builder
            },

          }
          return builder
        }

        const render: ComposeDSL['render'] = (src, path, data) => {
          tasks.push({ kind: 'render', src, path, data })
        }

        const copy: ComposeDSL['copy'] = (src, path) => {
          tasks.push({ kind: 'copy', src, path })
        }

        program({ json, text, render, copy })
        return { tasks }
      }).pipe(
        Effect.withSpan('plan.build'),
        Effect.annotateLogs({ taskKind: 'plan.build' }),
        Effect.annotateSpans({ taskKind: 'plan.build' }),
      )

    const writeText = (absPath: string, content: string) =>
      fs.ensureDir(path.dirname(absPath)).pipe(Effect.zipRight(fs.writeFileString(absPath, content)))

    const encodeJson = (value: Record<string, unknown>) =>
      Schema.encode(Schema.parseJson({ space: 2 }))(value).pipe(
        Effect.mapError(error => new FileIOError({
          op: 'parse',
          path: '<memory>',
          message: `Failed to encode JSON: ${error}`,
        })),
      )

    const trackCreatedPath = (writtenPaths: Ref.Ref<TargetDir[]>, absPath: string) =>
      Ref.update(writtenPaths, paths => [...paths, makeTargetDir(absPath)])

    const cleanupCreatedPaths = (writtenPaths: Ref.Ref<TargetDir[]>) =>
      Ref.get(writtenPaths).pipe(
        Effect.flatMap(paths =>
          Effect.forEach(
            [...paths].reverse(),
            createdPath =>
              fs.remove(createdPath, { force: true, recursive: true }).pipe(
                Effect.catchAll(error =>
                  Effect.logWarning(`Failed to clean up generated path ${createdPath}: ${error.message}`),
                ),
              ),
            { concurrency: 1, discard: true },
          ),
        ),
      )

    const registerRollbackFinalizer = (writtenPaths: Ref.Ref<TargetDir[]>) =>
      Effect.scopeWith((scope) => {
        const rollbackOnFailure = (exit: Exit.Exit<unknown, unknown>) =>
          Exit.isFailure(exit) ? cleanupCreatedPaths(writtenPaths) : Effect.void

        return Scope.addFinalizerExit(scope, rollbackOnFailure)
      })

    const runTask = (task: Task, baseDir: TargetDir, config: ProjectConfig, writtenPaths: Ref.Ref<TargetDir[]>) =>
      Effect.gen(function* () {
        switch (task.kind) {
          // 复制文件
          case 'copy': {
            const abs = path.resolve(baseDir, task.path)
            if (yield* fs.exists(abs)) {
              return
            }
            yield* fs.ensureDir(path.dirname(abs))
            yield* fs.copyFile(task.src, abs)
            yield* trackCreatedPath(writtenPaths, abs)
            return
          }
          // 模板渲染，直接 write
          case 'render': {
            const content = yield* templates.render(makeTemplatePath(task.src), task.data, config)
            const abs = path.resolve(baseDir, task.path)
            const existed = yield* fs.exists(abs)
            yield* writeText(abs, content)
            if (!existed)
              yield* trackCreatedPath(writtenPaths, abs)
            return
          }
          // 组合 Json 文件
          case 'json': {
            const abs = path.resolve(baseDir, task.path)
            const existed = yield* fs.exists(abs)
            // 对 draft 产生副作用
            let draft: Record<string, unknown> = {}
            // render + modify
            if (task.readExisting && (yield* fs.exists(abs))) {
              const s = yield* fs.readFileString(abs)
              draft = yield* safeParseJson(s, abs)
            }
            // base + modify
            else if (task.base) {
              draft = task.base()
            }
            // 应用所有 reducer
            for (const reducer of task.reducers) {
              draft = produce(draft, (d) => {
                reducer(d)
              })
            }
            // 收尾工作
            if (task.finalize) {
              const finalize = task.finalize
              draft = produce(draft, (d) => {
                finalize(d)
              })
            }

            // 结果是否需要排序（稳定输出）
            let out = draft
            if (task.sortKeys) {
              out = sortJsonKeys(draft)
            }
            const content = `${yield* encodeJson(out)}\n`
            yield* writeText(abs, content)
            if (!existed)
              yield* trackCreatedPath(writtenPaths, abs)
            return
          }
          // 基础文本变换
          case 'text': {
            const abs = path.resolve(baseDir, task.path)
            const existed = yield* fs.exists(abs)
            let current = ''
            const shouldRead = task.readExisting !== false
            if (shouldRead && (yield* fs.exists(abs))) {
              current = yield* fs.readFileString(abs)
            }
            else if (task.base) {
              current = task.base()
            }
            for (const tr of task.transforms) current = tr(current)

            yield* writeText(abs, current)
            if (!existed)
              yield* trackCreatedPath(writtenPaths, abs)
          }
        }
      }).pipe(withProjectAnnotations(config, `plan.task.${task.kind}`, task.path))

    const apply: PlanServiceShape['apply'] = (p, baseDir, config) =>
      Effect.scoped(Effect.gen(function* () {
        const writtenPaths = yield* Ref.make<TargetDir[]>([])
        yield* registerRollbackFinalizer(writtenPaths)

        const generate = p.tasks.filter(t => t.kind === 'copy' || t.kind === 'render')
        const modify = p.tasks.filter(t => t.kind === 'json' || t.kind === 'text')

        // 1：并发执行生成类任务（copy/render）
        yield* Effect.forEach(generate, t => runTask(t, baseDir, config, writtenPaths), { concurrency: appConfig.defaultConcurrency })

        // 2：并发执行修改类任务（json/text）
        yield* Effect.forEach(modify, t => runTask(t, baseDir, config, writtenPaths), { concurrency: appConfig.defaultConcurrency })
      })).pipe(
        Effect.withSpan('plan.apply'),
        withProjectAnnotations(config, 'plan.apply', baseDir),
      )

    return { build, apply } satisfies PlanServiceShape
  }),
  dependencies: [FsService.Default, TemplateEngineService.Default, AppConfigService.Default],
}) {}

export const PlanLive = PlanService.Default
