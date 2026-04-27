import type { JsonBuilder } from '@/core/services/planner'
import type { CodeQuality, Linting, ProjectConfig } from '@/schema/project-config'
import { devDeps, scripts, when } from '@/utils/file-helper'

interface SelectOption<T> {
  readonly value: T
  readonly label: string
}

interface ConfirmQuestionContract {
  readonly message: string
  readonly initialValue: boolean
}

interface SelectQuestionContract<T> {
  readonly message: string
  readonly options: readonly SelectOption<T>[]
}

interface MultiSelectQuestionContract<T> extends SelectQuestionContract<T> {
  readonly required: boolean
}

interface WorkspaceBootstrapCommandSpec {
  readonly command: string
  readonly args: readonly string[]
}

type WorkspaceBootstrapQuestionPolicy = Pick<ProjectConfig, 'git' | 'linting'>
type WorkspaceBootstrapPackagePolicy = Pick<ProjectConfig, 'git' | 'linting' | 'codeQuality'>
type WorkspaceBootstrapCommandPolicy = Pick<ProjectConfig, 'git' | 'codeQuality'>
type InstallPolicyResolution = boolean | 'prompt'

const defaultWorkspaceBootstrapCodeQuality = ['lint-staged', 'commitlint'] as const satisfies readonly CodeQuality[]
const prepareCommitMsgHook = '[ -n "$2" ] || pnpm exec lobe-commit --hook "$1"'
const lintStagedHook = 'pnpm lint-staged'
const commitLintHook = 'pnpm exec commitlint --edit "$1"'

export const workspaceBootstrapQuestionContracts = {
  git: {
    message: 'initialize Git repository?',
    initialValue: true,
  } satisfies ConfirmQuestionContract,
  linting: {
    message: 'choose a linting tool:',
    options: [
      { value: 'antfu-eslint', label: 'Antfu ESLint' },
      { value: 'none', label: 'No Linting' },
    ],
  } satisfies SelectQuestionContract<Linting>,
  codeQuality: {
    message: 'choose code quality tools:',
    required: false,
    options: [
      { value: 'lint-staged', label: 'Lint Staged' },
      { value: 'commitlint', label: 'Commitlint' },
    ],
  } satisfies MultiSelectQuestionContract<CodeQuality>,
} as const

export function shouldAskWorkspaceBootstrapCodeQuality(config: WorkspaceBootstrapQuestionPolicy): boolean {
  return config.git && config.linting !== 'none'
}

export function getWorkspaceBootstrapPresetDefaults(git: boolean): {
  readonly linting: Linting
  readonly codeQuality: CodeQuality[]
} {
  return {
    linting: 'antfu-eslint',
    codeQuality: git ? [...defaultWorkspaceBootstrapCodeQuality] : [],
  }
}

export function resolveWorkspaceBootstrapInstallPolicy(options: {
  readonly cliInstallArg: boolean | undefined
  readonly isInteractive: boolean
}): InstallPolicyResolution {
  if (options.cliInstallArg !== undefined) {
    return options.cliInstallArg
  }

  return options.isInteractive ? 'prompt' : false
}

export function applyWorkspaceBootstrapPackageJson(
  entry: JsonBuilder,
  config: WorkspaceBootstrapPackagePolicy,
): JsonBuilder {
  return entry
    .modify(when(config.linting === 'antfu-eslint', devDeps({ '@antfu/eslint-config': '^8.2.0', 'eslint': '^10.2.1' })))
    .modify(when(config.linting === 'antfu-eslint', scripts({ 'lint': 'eslint', 'lint:fix': 'eslint --fix' })))
    .modify(when(config.git, devDeps({ '@lobehub/commit-cli': '^2.19.0' })))
    .modify(when(config.git, scripts({ 'commit': 'lobe-commit --hook', 'commit:config': 'lobe-commit --option' })))
    .modify(when(config.codeQuality.length > 0, devDeps({ husky: '^9.1.7' })))
    .modify(when(config.codeQuality.includes('lint-staged'), devDeps({ 'lint-staged': '^16.4.0' })))
    .modify(when(config.codeQuality.includes('commitlint'), devDeps({ '@commitlint/cli': '^20.5.0', '@commitlint/config-conventional': '^20.5.0' })))
}

export function getWorkspaceBootstrapCommandSpecs(
  config: WorkspaceBootstrapCommandPolicy,
  installDeps: boolean,
): WorkspaceBootstrapCommandSpec[] {
  const commands: WorkspaceBootstrapCommandSpec[] = []

  if (installDeps) {
    commands.push({ command: 'pnpm', args: ['install'] })
  }

  if (config.git) {
    commands.push({ command: 'git', args: ['init'] })
  }

  if (config.codeQuality.length > 0) {
    if (!installDeps) {
      commands.push({ command: 'pnpm', args: ['add', '-D', 'husky'] })
    }

    commands.push({ command: 'pnpm', args: ['exec', 'husky', 'init'] })
    commands.push({
      command: 'sh',
      args: ['-c', `echo '${prepareCommitMsgHook}' > .husky/prepare-commit-msg && chmod +x .husky/prepare-commit-msg`],
    })

    if (config.codeQuality.includes('lint-staged')) {
      commands.push({
        command: 'sh',
        args: ['-c', `echo '${lintStagedHook}' > .husky/pre-commit`],
      })
    }

    if (config.codeQuality.includes('commitlint')) {
      commands.push({
        command: 'sh',
        args: ['-c', `echo '${commitLintHook}' > .husky/commit-msg && chmod +x .husky/commit-msg`],
      })
    }
  }

  return commands
}
