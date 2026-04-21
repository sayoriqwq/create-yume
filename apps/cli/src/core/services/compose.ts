import type { StandardCommand } from '@effect/platform/Command'
import type { TargetDir } from '@/brand/target-dir'
import type { TemplatePath } from '@/brand/template-path'
import type { ProjectConfig } from '@/types/config'
import type { ComposeDSL } from '@/types/dsl'
import type { TemplateRegistry } from '@/types/template'
import path from 'node:path'
import process from 'node:process'
import { Effect } from 'effect'
import { makeTargetDir } from '@/brand/target-dir'
import { makeTemplatePath } from '@/brand/template-path'
import { isReactProject, isVueProject } from '@/utils/type-guard'
import { buildCommands } from '../commands'
import { ReactTemplates } from '../template-registry/react'
import { VueTemplates } from '../template-registry/vue'
import { CommandService } from './command'
import { OrchestratorService } from './orchestrator'

// 纯函数：直接把符合条件的模板注册到 DSL（不依赖环境）
export function buildTemplates(dsl: ComposeDSL, templateRoot: TemplatePath, config: ProjectConfig) {
  const register = <T>(registry: TemplateRegistry<T>) => {
    for (const item of Object.values(registry)) {
      if (!item.condition(config as T))
        continue
      const target = typeof item.target === 'string' ? item.target : item.target(config as T)
      const src = makeTemplatePath(path.join(templateRoot, item.template))
      dsl.render(src, target)
    }
  }
  if (isVueProject(config))
    register(VueTemplates)
  if (isReactProject(config))
    register(ReactTemplates)
}

// 返回需要注册的 partial 目录（供调用方自行调用 templateEngine.registerPartials）
export function collectPartialEntries(config: ProjectConfig, partialRoot: TemplatePath) {
  const entries: Array<{ dir: TemplatePath, namespace: string }> = []
  if (isVueProject(config))
    entries.push({ dir: makeTemplatePath(path.join(partialRoot, 'vue')), namespace: 'vue' })
  if (isReactProject(config))
    entries.push({ dir: makeTemplatePath(path.join(partialRoot, 'react')), namespace: 'react' })
  entries.push({ dir: partialRoot, namespace: 'global' })
  return entries
}

export function generateProject(projectConfig: ProjectConfig) {
  return Effect.gen(function* () {
    yield* Effect.logInfo('🔧 Generating your project...')
    const orchestrator = yield* OrchestratorService
    const targetDir = makeTargetDir(`./${projectConfig.name}`)
    yield* orchestrator.execute(targetDir, projectConfig)
  })
}

export function executeAllCommands(commands: StandardCommand[]) {
  return Effect.gen(function* () {
    const commandSvc = yield* CommandService
    for (const command of commands)
      yield* commandSvc.execute(command)
  })
}

// 在指定目录下执行所有命令（临时 chdir，执行完恢复）
export function executeAllCommandsInDir(commands: StandardCommand[], dir: TargetDir) {
  return Effect.gen(function* () {
    const commandSvc = yield* CommandService
    const previousCwd = process.cwd()
    yield* Effect.try(() => process.chdir(dir))
    try {
      for (const command of commands)
        yield* commandSvc.execute(command)
    }
    finally {
      process.chdir(previousCwd)
    }
  })
}

export function finishProject(config: ProjectConfig) {
  return Effect.gen(function* () {
    const commands = yield* buildCommands(config)
    const targetDir = makeTargetDir(`./${config.name}`)
    yield* executeAllCommandsInDir(commands, targetDir)
    yield* Effect.logInfo('🎉 Project generated successfully!')
  })
}
