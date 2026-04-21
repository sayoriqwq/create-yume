#!/usr/bin/env node

import { DevTools } from '@effect/experimental'
import { NodeContext, NodeFileSystem, NodeRuntime } from '@effect/platform-node'
import { Effect, Layer, Logger, LogLevel, pipe } from 'effect'
import { OrchestratorLive } from '@/core/services/orchestrator'
import { TracingLive } from '@/core/services/tracing'
import { FsLive } from '~/fs'
import { TemplateEngineLive } from '~/template-engine'
import { showConfigSummary, showWelcome } from './core/compose'
import { collectQuestions } from './core/questions/compose'
import { CommandLive } from './core/services/command'
import { finishProject, generateProject } from './core/services/compose'
import { PlanLive } from './core/services/planner'

// andThen: 顺序执行，丢弃前者结构
// tap: 基于当前值副作用 & 不改变 pipeline 的值
const main = pipe(
  showWelcome,
  Effect.andThen(collectQuestions),
  Effect.tap(showConfigSummary),
  Effect.tap(generateProject),
  Effect.tap(finishProject),
)

const BaseLayer = Layer.mergeAll(
  // 如果后续引入 tracing layer，DevTools 需要先于 tracing layer 注入。
  DevTools.layer(),
  TracingLive,
  Logger.minimumLogLevel(LogLevel.Debug),
  Logger.pretty,
  CommandLive,
  // 平台
  NodeFileSystem.layer,
  NodeContext.layer,
)

const AppLayer = OrchestratorLive.pipe(
  Layer.provideMerge(
    PlanLive.pipe(
      Layer.provideMerge(
        TemplateEngineLive.pipe(
          Layer.provideMerge(
            FsLive.pipe(Layer.provideMerge(BaseLayer)),
          ),
        ),
      ),
    ),
  ),
)

const program = main.pipe(
  Effect.provide(AppLayer),
)

// https://effect.website/docs/platform/runtime/#running-your-main-program-with-runmain
NodeRuntime.runMain(program)
