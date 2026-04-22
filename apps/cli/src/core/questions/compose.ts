import type { CodeQuality } from '@/types/config'
import { Effect, ParseResult } from 'effect'
import { getSharedFrontendPresetDefaults } from '@/core/template-registry/frontend-app'
import { decodeProjectConfig, formatProjectConfigError } from '@/schema/project-config'
import { SchemaContractError } from '@/types/error'
import { isNone } from '@/utils/none'
import { FsService } from '~/fs'
import { ask } from '../adapters/prompts'
import { CliContext } from '../cli-context'
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
  const cli = yield* CliContext
  const preferredName = cli.args.name

  while (true) {
    const name = preferredName ?? (yield* ask(askProjectName))
    const targetDir = `./${name}`

    const exists = yield* fs.exists(targetDir)
    if (!exists) {
      return name
    }

    if (cli.args.yes) {
      yield* fs.remove(targetDir, { recursive: true, force: true })
      return name
    }

    if (preferredName && !cli.isInteractive) {
      return yield* new SchemaContractError({
        schema: 'CliArgs',
        message: `Target directory "${targetDir}" already exists. Re-run with --yes to replace it.`,
      })
    }

    const confirmRemove = yield* ask(() => askRemoveExisting(name))
    if (confirmRemove) {
      yield* fs.remove(targetDir, { recursive: true, force: true })
      return name
    }

    if (preferredName) {
      return yield* new SchemaContractError({
        schema: 'CliArgs',
        message: `Target directory "${targetDir}" already exists and was not removed.`,
      })
    }

    yield* Effect.logWarning('目录已存在且未选择删除，请重新输入项目名。')
  }
})

const askBaseCommon = Effect.gen(function* () {
  const cli = yield* CliContext
  const name = yield* askProjectNameSafe
  const language = yield* ask(askLanguage)
  const git = cli.args.git ?? (yield* ask(askGit))
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
  const cli = yield* CliContext
  const preset = cli.args.preset ?? (yield* ask(askPreset))
  const name = yield* askProjectNameSafe
  const git = cli.args.git ?? true
  const codeQuality: CodeQuality[] = git ? ['lint-staged', 'commitlint'] : []

  switch (preset) {
    case 'react-app': {
      const frontend = getSharedFrontendPresetDefaults('react-app')
      return {
        name,
        type: 'react',
        language: 'typescript',
        git,
        linting: 'antfu-eslint',
        codeQuality,
        ...frontend,
        router: 'react-router',
        stateManagement: 'jotai',
      }
    }
    case 'vue-app': {
      const frontend = getSharedFrontendPresetDefaults('vue-app')
      return {
        name,
        type: 'vue',
        language: 'typescript',
        git,
        linting: 'antfu-eslint',
        codeQuality,
        ...frontend,
        router: true,
        stateManagement: true,
      }
    }
    default:
      return yield* Effect.dieMessage('Unsupported preset')
  }
})

export const collectQuestions = Effect.gen(function* () {
  const cli = yield* CliContext

  if (!cli.isInteractive) {
    return yield* createPreset.pipe(Effect.flatMap(decodeCollectedProjectConfig))
  }

  const createMode = yield* ask(askCreateMode)
  switch (createMode) {
    case 'create':
      return yield* createProject.pipe(Effect.flatMap(decodeCollectedProjectConfig))
    case 'preset':
      return yield* createPreset.pipe(Effect.flatMap(decodeCollectedProjectConfig))
    default:
      return yield* Effect.dieMessage('Unsupported create mode')
  }
}).pipe(
  Effect.withSpan('questions.collect'),
  Effect.annotateLogs({ taskKind: 'questions.collect' }),
  Effect.annotateSpans({ taskKind: 'questions.collect' }),
)
