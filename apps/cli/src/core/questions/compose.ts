import type { CodeQuality } from '@/types/config'
import { Effect, ParseResult } from 'effect'
import { decodeProjectConfig, formatProjectConfigError } from '@/schema/project-config'
import { SchemaContractError } from '@/types/error'
import { isNone } from '@/utils/none'
import { FsService } from '~/fs'
import { ask } from '../adapters/prompts'
import { askProjectName } from '../questions/common/project-name'
import { askRemoveExisting } from '../questions/common/remove-existing'
import { askCodeQuality } from './common/code-quality'
import { askGit } from './common/git'
import { askLanguage } from './common/language'
import { askLinting } from './common/linting'
import { askPreset } from './common/preset'
import { askCreateMode } from './create-mode'
import { askBuildTool } from './frontend/build-tool'
import { askCSSFramework } from './frontend/css-framework'
import { askCSSPreprocessor } from './frontend/css-preprocessor'
import { askProjectType } from './project-type'
import { askReactRouter } from './react/router'
import { askReactStateManagement } from './react/state-management'
import { askVueRouter } from './vue/router'
import { askVueStateManagement } from './vue/state-management'

const askProjectNameSafe = Effect.gen(function* () {
  const fs = yield* FsService

  while (true) {
    const name = yield* ask(askProjectName)
    const targetDir = `./${name}`

    const exists = yield* fs.exists(targetDir)
    if (!exists) {
      return name
    }

    const confirmRemove = yield* ask(() => askRemoveExisting(name))
    if (confirmRemove) {
      yield* fs.remove(targetDir, { recursive: true, force: true })
      return name
    }

    yield* Effect.logWarning('目录已存在且未选择删除，请重新输入项目名。')
  }
})

const askBaseCommon = Effect.gen(function* () {
  const name = yield* askProjectNameSafe
  const language = yield* ask(askLanguage)
  const git = yield* ask(askGit)
  const linting = yield* ask(askLinting)
  let codeQuality: CodeQuality[] = []
  if (git && !isNone(linting)) {
    codeQuality = yield* ask(askCodeQuality)
  }
  return { name, language, git, linting, codeQuality }
})

const askFrontendCommon = Effect.gen(function* () {
  const buildTool = yield* ask(askBuildTool)
  const cssPreprocessor = yield* ask(askCSSPreprocessor)
  const cssFramework = yield* ask(askCSSFramework)
  return { buildTool, cssPreprocessor, cssFramework }
})

function decodeCollectedProjectConfig(input: unknown) {
  return decodeProjectConfig(input).pipe(
    Effect.mapError(error => new SchemaContractError({
      schema: 'ProjectConfig',
      message: formatProjectConfigError(error),
      issueCount: ParseResult.ArrayFormatter.formatErrorSync(error).length,
    })),
  )
}

export const createProject = Effect.gen(function* () {
  const projectType = yield* ask(askProjectType)
  const base = yield* askBaseCommon

  if (projectType === 'vue') {
    const frontend = yield* askFrontendCommon
    const router = yield* ask(askVueRouter)
    const stateManagement = yield* ask(askVueStateManagement)
    return {
      ...base,
      ...frontend,
      type: 'vue',
      router,
      stateManagement,
    }
  }

  if (projectType === 'react') {
    const frontend = yield* askFrontendCommon
    const router = yield* ask(askReactRouter)
    const stateManagement = yield* ask(askReactStateManagement)
    return {
      ...base,
      ...frontend,
      type: 'react',
      router,
      stateManagement,
    }
  }

  return yield* Effect.dieMessage('Unsupported project type')
})

const createPreset = Effect.gen(function* () {
  const preset = yield* ask(askPreset)
  const name = yield* askProjectNameSafe
  switch (preset) {
    case 'react-app': {
      return {
        name,
        type: 'react',
        language: 'typescript',
        git: true,
        linting: 'antfu-eslint',
        codeQuality: ['lint-staged', 'commitlint'],
        buildTool: 'vite',
        router: 'react-router',
        stateManagement: 'jotai',
        cssPreprocessor: 'less',
        cssFramework: 'tailwind',
      }
    }
    case 'vue-app': {
      return {
        name,
        type: 'vue',
        language: 'typescript',
        git: true,
        linting: 'antfu-eslint',
        codeQuality: ['lint-staged', 'commitlint'],
        buildTool: 'vite',
        router: true,
        stateManagement: true,
        cssPreprocessor: 'less',
        cssFramework: 'tailwind',
      }
    }
    default:
      return yield* Effect.dieMessage('Unsupported preset')
  }
})

export const collectQuestions = Effect.gen(function* () {
  const createMode = yield* ask(askCreateMode)
  switch (createMode) {
    case 'create':
      return yield* createProject.pipe(Effect.flatMap(decodeCollectedProjectConfig))
    case 'preset':
      return yield* createPreset.pipe(Effect.flatMap(decodeCollectedProjectConfig))
    default:
      return yield* Effect.dieMessage('Unsupported create mode')
  }
})
