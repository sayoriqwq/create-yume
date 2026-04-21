#!/usr/bin/env node

import { DevTools } from '@effect/experimental'
import { NodeContext, NodeFileSystem, NodeRuntime } from '@effect/platform-node'
import { Effect, Layer, Logger, pipe } from 'effect'
import { AppConfig } from '@/config/app-config'
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

const DevToolsLive = Layer.unwrapEffect(
  Effect.map(AppConfig, config => (config.debug ? DevTools.layer() : Layer.empty)),
)

const LoggerLevelLive = Layer.unwrapEffect(
  Effect.map(AppConfig, config => Logger.minimumLogLevel(config.logLevel)),
)

const PlatformLayer = Layer.mergeAll(
  NodeFileSystem.layer,
  NodeContext.layer,
  AppConfig.Default,
)

const BaseLayer = Layer.mergeAll(
  DevToolsLive,
  TracingLive,
  LoggerLevelLive,
  Logger.pretty,
  CommandLive,
  FsLive,
).pipe(Layer.provideMerge(PlatformLayer))

const OrchestratorLayer = OrchestratorLive.pipe(
  Layer.provideMerge(
    PlanLive.pipe(
      Layer.provideMerge(
        TemplateEngineLive.pipe(
          Layer.provideMerge(BaseLayer),
        ),
      ),
    ),
  ),
)

const program = main.pipe(
  Effect.provide(Layer.mergeAll(BaseLayer, OrchestratorLayer)),
)

// https://effect.website/docs/platform/runtime/#running-your-main-program-with-runmain
NodeRuntime.runMain(program)
