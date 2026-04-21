// 提供一个小型 DSL 来声明如何生成/编辑文件。
import type { ProjectConfig } from '@/types/config'
import type { ComposeDSL, JsonBuilder, TextBuilder } from '@/types/dsl'
import type { TemplateError } from '@/types/error'
import type { JsonTask, Plan, Task, TextTask } from '@/types/task'
import * as path from 'node:path'
import { Context, Effect, Layer, Schema } from 'effect'
import { produce } from 'immer'
import { DEFAULT_CONCURRENCY } from '@/constants/effect'
import { FileIOError } from '@/types/error'
import { sortJsonKeys } from '@/utils/file-helper'
import { FsService } from '~/fs'
import { TemplateEngineService } from '~/template-engine'
import { safeParseJson } from '../adapters/json'

interface PlanService {
  // 组合 tasks 但是不触发
  readonly build: (
    program: (dsl: ComposeDSL) => void,
  ) => Effect.Effect<Plan, never>
  // 执行计划中的所有任务
  readonly apply: (
    plan: Plan,
    baseDir: string,
    config: ProjectConfig,
  ) => Effect.Effect<void, FileIOError | TemplateError>
}

class PlanTag extends Context.Tag('Plan')<
  PlanTag,
  PlanService
>() {}

export const PlanLive = Layer.effect(
  PlanTag,
  Effect.gen(function* () {
    const fs = yield* FsService
    const templates = yield* TemplateEngineService

    const build: PlanService['build'] = program =>
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
              task.reducers.push((draft) => {
                const obj = typeof patch === 'function' ? patch(draft) : patch
                Object.assign(draft, obj)
              })
              return builder
            },
            modify(fn) {
              task.reducers.push(fn)
              return builder
            },

            finalize(fn) {
              task.finalize = fn
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
              task.transforms.push(fn)
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
      })

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

    const runTask = (task: Task, baseDir: string, config: ProjectConfig) =>
      Effect.gen(function* () {
        switch (task.kind) {
          // 复制文件
          case 'copy': {
            const abs = path.resolve(baseDir, task.path)
            if (yield* fs.exists(abs)) {
              return
            }
            yield* fs.ensureDir(path.dirname(abs))
            return yield* fs.copyFile(task.src, abs)
          }
          // 模板渲染，直接 write
          case 'render': {
            const content = yield* templates.render(task.src, task.data, config)
            const abs = path.resolve(baseDir, task.path)
            yield* writeText(abs, content)
            return
          }
          // 组合 Json 文件
          case 'json': {
            const abs = path.resolve(baseDir, task.path)
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
              draft = produce(draft, (d) => {
                // 这里是 bug 吗，为什么判断了还是会 ts 报错
                task.finalize!(d)
              })
            }

            // 结果是否需要排序（稳定输出）
            let out = draft
            if (task.sortKeys) {
              out = sortJsonKeys(draft)
            }
            const content = `${yield* encodeJson(out)}\n`
            yield* writeText(abs, content)
            return
          }
          // 基础文本变换
          case 'text': {
            const abs = path.resolve(baseDir, task.path)
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
          }
        }
      })

    const apply: PlanService['apply'] = (p, baseDir, config) =>
      Effect.gen(function* () {
        const generate = p.tasks.filter(t => t.kind === 'copy' || t.kind === 'render')
        const modify = p.tasks.filter(t => t.kind === 'json' || t.kind === 'text')

        // 1：并发执行生成类任务（copy/render）
        yield* Effect.forEach(generate, t => runTask(t, baseDir, config), { concurrency: DEFAULT_CONCURRENCY })

        // 2：并发执行修改类任务（json/text）
        yield* Effect.forEach(modify, t => runTask(t, baseDir, config), { concurrency: DEFAULT_CONCURRENCY })
      })

    return PlanTag.of({ build, apply })
  }),
)

export { PlanTag as PlanService }
