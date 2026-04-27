import type { PostGenerateCommand } from '../commands'
import type { TargetDir } from '@/brand/target-dir'
import type { TemplatePath } from '@/brand/template-path'
import type { TemplateError } from '@/core/errors'
import type { ContributionTrace } from '@/core/ownership/model'
import type {
  JsonLiteral,
  PlanOperationSpec,
  PlanSpec,
} from '@/schema/plan-spec'
// 提供一个小型 DSL 来声明如何生成/编辑文件。
import type { ProjectConfig } from '@/schema/project-config'
import * as path from 'node:path'
import { Effect, Exit, Ref, Schema, Scope } from 'effect'
import { produce } from 'immer'
import { makeTargetDir } from '@/brand/target-dir'
import { makeTemplatePath } from '@/brand/template-path'
import { AppConfig as AppConfigService } from '@/config/app-config'
import { FileIOError, PlanConflictError } from '@/core/errors'
import { sortJsonKeys } from '@/utils/file-helper'
import { FsService } from '~/fs'
import { TemplateEngineService } from '~/template-engine'
import { safeParseJson } from '../adapters/json'
import { toPostGenerateCommandSpec } from '../commands'
import { withProjectAnnotations } from './observability'

export interface JsonBuilder {
  readExisting: (flag?: boolean) => JsonBuilder
  sortKeys: (flag?: boolean) => JsonBuilder
  base: (fn: () => Record<string, unknown>) => JsonBuilder
  merge: (
    patch: Record<string, unknown> | ((draft: Record<string, unknown>) => Record<string, unknown>),
    ownership?: ContributionTrace,
  ) => JsonBuilder
  modify: (
    fn: (draft: Record<string, unknown>) => void,
    ownership?: ContributionTrace,
  ) => JsonBuilder
  finalize: (
    fn: (draft: Record<string, unknown>) => void,
    ownership?: ContributionTrace,
  ) => void
}

export interface TextBuilder {
  readExisting: (flag?: boolean) => TextBuilder
  base: (fn: () => string) => TextBuilder
  transform: (
    fn: (current: string) => string,
    ownership?: ContributionTrace,
  ) => TextBuilder
}

export interface ComposeDSL {
  json: (path: string, ownership?: ContributionTrace) => JsonBuilder
  text: (path: string, ownership?: ContributionTrace) => TextBuilder
  copy: (src: TemplatePath, path: string, ownership?: ContributionTrace) => void
  render: (src: TemplatePath, path: string, data?: object, ownership?: ContributionTrace) => void
}

export type GenerateTask = RenderTask | CopyTask
export type ModifyTask = JsonTask | TextTask
export type Task = GenerateTask | ModifyTask

interface ITask {
  kind: 'render' | 'copy' | 'json' | 'text'
  path: string
  ownership?: ContributionTrace
}

export interface RenderTask extends ITask {
  kind: 'render'
  src: string
  data?: unknown
}

export interface CopyTask extends ITask {
  kind: 'copy'
  src: string
}

export interface JsonTask extends ITask {
  kind: 'json'
  readExisting?: boolean
  sortKeys?: boolean
  reducers: Array<(draft: Record<string, unknown>) => void>
  base?: () => Record<string, unknown>
  finalize?: (draft: Record<string, unknown>) => void
}

export interface TextTask extends ITask {
  kind: 'text'
  readExisting?: boolean
  transforms: Array<(current: string) => string>
  base?: () => string
}

export interface Plan {
  tasks: Task[]
  postGenerateCommands?: PostGenerateCommand[]
}

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

function findDuplicateTargetPath(tasks: Task[]) {
  const taskKindsByPath = new Map<string, Task['kind'][]>()

  for (const task of tasks) {
    const taskKinds = taskKindsByPath.get(task.path)
    if (taskKinds) {
      taskKinds.push(task.kind)
      return {
        path: task.path,
        taskKinds,
      }
    }

    taskKindsByPath.set(task.path, [task.kind])
  }

  return undefined
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
            ...(task.ownership ? { ownership: task.ownership } : {}),
          }
        }
        case 'copy':
          return {
            kind: 'copy',
            path: task.path,
            src: makeTemplatePath(task.src),
            ...(task.ownership ? { ownership: task.ownership } : {}),
          }
        case 'json': {
          const base = task.base ? toJsonLiteral(task.base()) : undefined
          const finalize = getOperationSpec(task.finalize, 'finalize')
          return {
            kind: 'json',
            path: task.path,
            ...(task.ownership ? { ownership: task.ownership } : {}),
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
            ...(task.ownership ? { ownership: task.ownership } : {}),
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
    ...(plan.postGenerateCommands
      ? {
          postGenerateCommands: plan.postGenerateCommands.map(toPostGenerateCommandSpec),
        }
      : {}),
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
    options?: { readonly rollbackOnFailure?: boolean },
  ) => Effect.Effect<void, FileIOError | PlanConflictError | TemplateError>
}

export class PlanService extends Effect.Service<PlanService>()('PlanService', {
  effect: Effect.gen(function* () {
    const fs = yield* FsService
    const templates = yield* TemplateEngineService
    const appConfig = yield* AppConfigService

    const build: PlanServiceShape['build'] = program =>
      Effect.sync<Plan>(() => {
        const tasks: Task[] = []

        const json: ComposeDSL['json'] = (path, ownership) => {
          const task: JsonTask = { kind: 'json', path, reducers: [], ...(ownership ? { ownership } : {}) }
          tasks.push(task)
          const builder: JsonBuilder = {
            readExisting(flag) {
              if (flag === undefined)
                delete task.readExisting
              else
                task.readExisting = flag
              return builder
            },
            sortKeys(flag) {
              if (flag === undefined)
                delete task.sortKeys
              else
                task.sortKeys = flag
              return builder
            },
            base(fn) {
              task.base = fn
              return builder
            },
            merge(patch, ownership) {
              const input = typeof patch === 'function' ? undefined : toJsonLiteral(patch)
              const reducer = annotateOperation((draft: Record<string, unknown>) => {
                const obj = typeof patch === 'function' ? patch(draft) : patch
                Object.assign(draft, obj)
              }, {
                reducer: typeof patch === 'function' ? patch.name || 'merge' : 'merge',
                ...(ownership ? { ownership } : {}),
                ...(input !== undefined ? { input } : {}),
              })
              task.reducers.push(reducer)
              return builder
            },
            modify(fn, ownership) {
              task.reducers.push(annotateOperation(fn, {
                reducer: fn.name || 'modify',
                ...(ownership ? { ownership } : {}),
              }))
              return builder
            },

            finalize(fn, ownership) {
              task.finalize = annotateOperation(fn, {
                reducer: fn.name || 'finalize',
                ...(ownership ? { ownership } : {}),
              })
              return builder
            },

          }
          return builder
        }

        const text: ComposeDSL['text'] = (path, ownership) => {
          const task: TextTask = { kind: 'text', path, transforms: [], ...(ownership ? { ownership } : {}) }
          tasks.push(task)
          const builder: TextBuilder = {
            readExisting(flag) {
              if (flag === undefined)
                delete task.readExisting
              else
                task.readExisting = flag
              return builder
            },
            base(fn) {
              task.base = fn
              return builder
            },
            transform(fn, ownership) {
              task.transforms.push(annotateOperation(fn, {
                reducer: fn.name || 'transform',
                ...(ownership ? { ownership } : {}),
              }))
              return builder
            },

          }
          return builder
        }

        const render: ComposeDSL['render'] = (src, path, data, ownership) => {
          tasks.push({ kind: 'render', src, path, ...(data !== undefined ? { data } : {}), ...(ownership ? { ownership } : {}) })
        }

        const copy: ComposeDSL['copy'] = (src, path, ownership) => {
          tasks.push({ kind: 'copy', src, path, ...(ownership ? { ownership } : {}) })
        }

        program({ json, text, render, copy })
        return { tasks }
      }).pipe(
        Effect.withSpan('plan.build'),
        Effect.annotateLogs({ taskKind: 'plan.build' }),
        Effect.annotateSpans({ taskKind: 'plan.build' }),
      )

    const trackCreatedFile = (writtenPaths: Ref.Ref<TargetDir[]>, absPath: string) =>
      Ref.update(writtenPaths, paths => [...paths, makeTargetDir(absPath)])

    const encodeJson = (value: Record<string, unknown>) =>
      Schema.encode(Schema.parseJson({ space: 2 }))(value).pipe(
        Effect.mapError(error => new FileIOError({
          op: 'parse',
          path: '<memory>',
          message: `Failed to encode JSON: ${error}`,
        })),
      )

    const trackCreatedDirectory = (createdDirs: Ref.Ref<TargetDir[]>, absPath: string) =>
      Ref.update(createdDirs, paths => [...paths, makeTargetDir(absPath)])

    const ensureTrackedDirectories = (
      baseDir: TargetDir,
      absPath: string,
      createdDirs: Ref.Ref<TargetDir[]>,
    ) =>
      Effect.gen(function* () {
        const resolvedBaseDir = path.resolve(baseDir)
        const targetDir = path.dirname(absPath)
        const relativeTargetDir = path.relative(resolvedBaseDir, targetDir)

        if (relativeTargetDir.startsWith('..') || path.isAbsolute(relativeTargetDir)) {
          yield* fs.ensureDir(targetDir)
          return
        }

        const segments = relativeTargetDir === ''
          ? []
          : relativeTargetDir.split(path.sep).filter(Boolean)

        let currentDir = resolvedBaseDir
        const directories = [resolvedBaseDir]

        for (const segment of segments) {
          currentDir = path.join(currentDir, segment)
          directories.push(currentDir)
        }

        for (const directory of directories) {
          if (yield* fs.exists(directory)) {
            continue
          }

          yield* fs.makeDirectory(directory).pipe(
            Effect.tap(() => trackCreatedDirectory(createdDirs, directory)),
            Effect.catchAll(error =>
              fs.exists(directory).pipe(
                Effect.flatMap(exists => exists ? Effect.void : Effect.fail(error)),
              ),
            ),
          )
        }
      })

    const writeText = (
      baseDir: TargetDir,
      absPath: string,
      content: string,
      createdDirs: Ref.Ref<TargetDir[]>,
    ) =>
      ensureTrackedDirectories(baseDir, absPath, createdDirs).pipe(
        Effect.zipRight(fs.writeFileString(absPath, content)),
      )

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

    const cleanupCreatedDirectories = (createdDirs: Ref.Ref<TargetDir[]>) =>
      Ref.get(createdDirs).pipe(
        Effect.flatMap(paths =>
          Effect.forEach(
            [...paths].reverse(),
            createdDir =>
              fs.remove(createdDir, { force: true, recursive: true }).pipe(
                Effect.catchAll(error =>
                  Effect.logWarning(`Failed to clean up generated directory ${createdDir}: ${error.message}`),
                ),
              ),
            { concurrency: 1, discard: true },
          ),
        ),
      )

    const registerRollbackFinalizer = (
      writtenPaths: Ref.Ref<TargetDir[]>,
      createdDirs: Ref.Ref<TargetDir[]>,
      enabled: boolean,
    ) => {
      if (!enabled) {
        return Effect.void
      }

      return Effect.scopeWith((scope) => {
        const rollbackOnFailure = (exit: Exit.Exit<unknown, unknown>) =>
          Exit.isFailure(exit)
            ? cleanupCreatedPaths(writtenPaths).pipe(
                Effect.zipRight(cleanupCreatedDirectories(createdDirs)),
              )
            : Effect.void

        return Scope.addFinalizerExit(scope, rollbackOnFailure)
      })
    }

    const runTask = (
      task: Task,
      baseDir: TargetDir,
      config: ProjectConfig,
      writtenPaths: Ref.Ref<TargetDir[]>,
      createdDirs: Ref.Ref<TargetDir[]>,
    ) =>
      Effect.gen(function* () {
        switch (task.kind) {
          // 复制文件
          case 'copy': {
            const abs = path.resolve(baseDir, task.path)
            if (yield* fs.exists(abs)) {
              return
            }
            yield* ensureTrackedDirectories(baseDir, abs, createdDirs)
            yield* fs.copyFile(task.src, abs)
            yield* trackCreatedFile(writtenPaths, abs)
            return
          }
          // 模板渲染，直接 write
          case 'render': {
            const content = yield* templates.render(makeTemplatePath(task.src), task.data, config)
            const abs = path.resolve(baseDir, task.path)
            const existed = yield* fs.exists(abs)
            yield* writeText(baseDir, abs, content, createdDirs)
            if (!existed)
              yield* trackCreatedFile(writtenPaths, abs)
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
            yield* writeText(baseDir, abs, content, createdDirs)
            if (!existed)
              yield* trackCreatedFile(writtenPaths, abs)
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

            yield* writeText(baseDir, abs, current, createdDirs)
            if (!existed)
              yield* trackCreatedFile(writtenPaths, abs)
          }
        }
      }).pipe(withProjectAnnotations(config, `plan.task.${task.kind}`, task.path))

    const apply: PlanServiceShape['apply'] = (p, baseDir, config, options) =>
      Effect.scoped(Effect.gen(function* () {
        const conflict = findDuplicateTargetPath(p.tasks)
        if (conflict) {
          return yield* new PlanConflictError({
            path: conflict.path,
            taskKinds: [...conflict.taskKinds],
            message: `Duplicate target path "${conflict.path}" is not allowed within a plan apply`,
          })
        }

        const writtenPaths = yield* Ref.make<TargetDir[]>([])
        const createdDirs = yield* Ref.make<TargetDir[]>([])
        yield* registerRollbackFinalizer(
          writtenPaths,
          createdDirs,
          options?.rollbackOnFailure ?? true,
        )

        const generate = p.tasks.filter(t => t.kind === 'copy' || t.kind === 'render')
        const modify = p.tasks.filter(t => t.kind === 'json' || t.kind === 'text')

        // 1：并发执行生成类任务（copy/render）
        yield* Effect.forEach(
          generate,
          t => runTask(t, baseDir, config, writtenPaths, createdDirs),
          { concurrency: appConfig.defaultConcurrency },
        )

        // 2：并发执行修改类任务（json/text）
        yield* Effect.forEach(
          modify,
          t => runTask(t, baseDir, config, writtenPaths, createdDirs),
          { concurrency: appConfig.defaultConcurrency },
        )
      })).pipe(
        Effect.withSpan('plan.apply'),
        withProjectAnnotations(config, 'plan.apply', baseDir),
      )

    return { build, apply } satisfies PlanServiceShape
  }),
  dependencies: [FsService.Default, TemplateEngineService.Default, AppConfigService.Default],
}) {}

export const PlanLive = PlanService.Default
