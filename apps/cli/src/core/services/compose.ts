import type { StandardCommand } from '@effect/platform/Command'
import type { TargetDir } from '@/brand/target-dir'
import type { TemplatePath } from '@/brand/template-path'
import type { ContributionTrace } from '@/core/ownership/model'
import type { ProjectConfig } from '@/types/config'
import type { ComposeDSL } from '@/types/dsl'
import type { TemplateRegistry } from '@/types/template'
import path from 'node:path'
import { Command } from '@effect/platform'
import { Effect } from 'effect'
import { makeTargetDir } from '@/brand/target-dir'
import { makeTemplatePath } from '@/brand/template-path'
import {
  contributionTrace,
  ContributionUnitKind,
  FrontendScaffoldOwner,
  ReactScaffoldOwner,
  VueScaffoldOwner,
} from '@/core/ownership/model'
import { isReactProject, isVueProject } from '@/utils/type-guard'
import { CliContext } from '../cli-context'
import { buildCommands } from '../commands'
import { ReactTemplates } from '../template-registry/react'
import { VueTemplates } from '../template-registry/vue'
import { CommandService } from './command'
import { withProjectAnnotations } from './observability'
import { OrchestratorService } from './orchestrator'

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

// 返回需要注册的 partial 目录（供调用方自行调用 templateEngine.registerPartials）
export interface PartialEntry {
  readonly dir: TemplatePath
  readonly namespace: string
  readonly ownership: ContributionTrace
}

function partialNamespace(owner: typeof ReactScaffoldOwner | typeof VueScaffoldOwner | typeof FrontendScaffoldOwner) {
  return contributionTrace(owner, ContributionUnitKind.PartialNamespace)
}

export function collectPartialEntries(config: ProjectConfig, partialRoot: TemplatePath) {
  const entries: PartialEntry[] = []
  if (isVueProject(config))
    entries.push({ dir: makeTemplatePath(path.join(partialRoot, 'vue')), namespace: 'vue', ownership: partialNamespace(VueScaffoldOwner) })
  if (isReactProject(config))
    entries.push({ dir: makeTemplatePath(path.join(partialRoot, 'react')), namespace: 'react', ownership: partialNamespace(ReactScaffoldOwner) })
  entries.push({ dir: makeTemplatePath(path.join(partialRoot, 'global')), namespace: 'global', ownership: partialNamespace(FrontendScaffoldOwner) })
  return entries
}

export function generateProject(projectConfig: ProjectConfig) {
  return Effect.gen(function* () {
    yield* Effect.logInfo('🔧 Generating your project...')
    const cli = yield* CliContext
    const orchestrator = yield* OrchestratorService
    const targetDir = makeTargetDir(`./${projectConfig.name}`)
    yield* orchestrator.execute(targetDir, projectConfig, {
      rollbackOnFailure: cli.args.rollback ?? true,
    })
  }).pipe(
    Effect.withSpan('generate.project'),
    withProjectAnnotations(projectConfig, 'generate.project', `./${projectConfig.name}`),
  )
}

export function executeAllCommands(commands: StandardCommand[]) {
  return Effect.gen(function* () {
    const commandSvc = yield* CommandService
    for (const command of commands)
      yield* commandSvc.execute(command)
  })
}

export function withWorkingDirectory(command: StandardCommand, dir: TargetDir): StandardCommand {
  return Command.workingDirectory(command, dir) as StandardCommand
}

export function executeAllCommandsInDir(commands: StandardCommand[], dir: TargetDir) {
  return Effect.gen(function* () {
    const commandSvc = yield* CommandService
    for (const command of commands)
      yield* commandSvc.execute(withWorkingDirectory(command, dir))
  })
}

export function finishProject(config: ProjectConfig) {
  return Effect.gen(function* () {
    const commands = yield* buildCommands(config)
    const targetDir = makeTargetDir(`./${config.name}`)
    yield* executeAllCommandsInDir(commands, targetDir)
    yield* Effect.logInfo('🎉 Project generated successfully!')
  }).pipe(
    Effect.withSpan('finish.project'),
    withProjectAnnotations(config, 'command.execute', `./${config.name}`),
  )
}
