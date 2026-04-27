import type { StandardCommand } from '@effect/platform/Command'
import type { PostGenerateCommand } from '../commands'
import type { TargetDir } from '@/brand/target-dir'
import type { TemplatePath } from '@/brand/template-path'
import type { ComposeDSL, Plan } from '@/core/services/planner'
import type { ProjectConfig } from '@/schema/project-config'
import type { TemplateRegistry } from '@/schema/template-registry'
import path from 'node:path'
import { Command } from '@effect/platform'
import { Effect } from 'effect'
import { makeProjectTargetDir, makeTargetDir } from '@/brand/target-dir'
import { makeTemplatePath } from '@/brand/template-path'
import { isReactProject, isVueProject } from '@/utils/type-guard'
import { CliContext } from '../cli-context'
import { buildCommands } from '../commands'
import { ReactTemplates } from '../template-registry/react'
import { VueTemplates } from '../template-registry/vue'
import { CommandService } from './command'
import { withProjectAnnotations } from './observability'
import { OrchestratorService } from './orchestrator'
import { toPlanSpec } from './planner'
import { collectTemplatePartialEntries } from './template-engine'

// 纯函数：直接把符合条件的模板注册到 DSL（不依赖环境）
export function buildTemplates(dsl: ComposeDSL, templateRoot: TemplatePath, config: ProjectConfig) {
  const register = <T>(registry: TemplateRegistry<T>) => {
    for (const item of Object.values(registry)) {
      if (!item.condition(config as T))
        continue
      const target = typeof item.target === 'string' ? item.target : item.target(config as T)
      const src = makeTemplatePath(path.join(templateRoot, item.template))
      dsl.render(src, target, undefined, item.ownership)
    }
  }
  if (isVueProject(config))
    register(VueTemplates)
  if (isReactProject(config))
    register(ReactTemplates)
}

// 兼容别名：partial 选择逻辑由 TemplateEngine 拥有，新代码应直接依赖 TemplateEngine.prepare。
export const collectPartialEntries = collectTemplatePartialEntries

export function generateProject(projectConfig: ProjectConfig) {
  const targetDir = makeProjectTargetDir(projectConfig.name)

  return Effect.gen(function* () {
    yield* Effect.logInfo('🔧 Generating your project...')
    const cli = yield* CliContext
    const orchestrator = yield* OrchestratorService
    const plan = yield* orchestrator.execute(targetDir, projectConfig, {
      rollbackOnFailure: cli.args.rollback ?? true,
    })
    const postGenerateCommands = yield* buildCommands(projectConfig)
    return {
      ...plan,
      ...(postGenerateCommands.length > 0 ? { postGenerateCommands } : {}),
    } satisfies Plan
  }).pipe(
    Effect.withSpan('generate.project'),
    withProjectAnnotations(projectConfig, 'generate.project', targetDir),
  )
}

export function withWorkingDirectory(command: StandardCommand, dir: TargetDir): StandardCommand {
  return Command.workingDirectory(command, dir) as StandardCommand
}

function executePostGenerateCommand(command: PostGenerateCommand, dir: TargetDir) {
  return Effect.gen(function* () {
    const commandSvc = yield* CommandService
    yield* commandSvc.execute(withWorkingDirectory(command.command, dir)).pipe(
      Effect.annotateLogs({
        commandOwner: command.ownership.owner,
        commandUnit: command.ownership.unit,
        commandPhase: command.phase,
      }),
      Effect.annotateSpans({
        commandOwner: command.ownership.owner,
        commandUnit: command.ownership.unit,
        commandPhase: command.phase,
      }),
    )
  })
}

export function executeAllCommandsInDir(commands: PostGenerateCommand[], dir: TargetDir) {
  return Effect.forEach(commands, command => executePostGenerateCommand(command, dir), {
    concurrency: 1,
    discard: true,
  })
}

export function finishProject(config: ProjectConfig, plan: Plan) {
  return Effect.gen(function* () {
    const tracedPlanSpec = toPlanSpec(plan)
    const postGenerateCommands = tracedPlanSpec.postGenerateCommands ?? []
    const postGenerateCommandTrace = postGenerateCommands
      .map(command => `${command.phase}:${command.ownership.owner}:${command.command} ${command.args.join(' ')}`)
      .join(' | ')
    const targetDir = makeTargetDir(`./${config.name}`)
    yield* Effect.logDebug('Prepared traced plan spec for post-generate commands').pipe(
      Effect.annotateLogs({
        postGenerateCommandCount: postGenerateCommands.length,
        ...(postGenerateCommandTrace ? { postGenerateCommands: postGenerateCommandTrace } : {}),
      }),
      Effect.annotateSpans({
        postGenerateCommandCount: postGenerateCommands.length,
        ...(postGenerateCommandTrace ? { postGenerateCommands: postGenerateCommandTrace } : {}),
      }),
    )
    yield* executeAllCommandsInDir(plan.postGenerateCommands ?? [], targetDir)
    yield* Effect.logInfo('🎉 Project generated successfully!')
  }).pipe(
    Effect.withSpan('finish.project'),
    withProjectAnnotations(config, 'finish.project', `./${config.name}`),
  )
}
