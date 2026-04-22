import type { StandardCommand } from '@effect/platform/Command'
import type { PostGenerateCommandPhaseSpec, PostGenerateCommandSpec } from '@/schema/plan-spec'
import type { ProjectConfig } from '@/types/config'
import { Effect } from 'effect'
import { makeCommandName } from '@/brand/command-name'
import {
  contributionTrace,
  ContributionUnitKind,
  WorkspaceBootstrapOwner,
} from '@/core/ownership/model'
import { ask } from '../adapters/prompts'
import { CliContext } from '../cli-context'
import { askInstallDeps } from '../questions/common/install-deps'
import { CommandService } from '../services/command'

const PostGenerateCommandPhase = {
  AfterPlanApply: 'after-plan-apply',
} as const

export interface PostGenerateCommand {
  readonly command: StandardCommand
  readonly phase: PostGenerateCommandPhaseSpec
  readonly ownership: ReturnType<typeof contributionTrace>
}

const postGenerateCommandOwnership = contributionTrace(
  WorkspaceBootstrapOwner,
  ContributionUnitKind.PostGenerateCommand,
)

function traceCommand(command: StandardCommand): PostGenerateCommand {
  return {
    command,
    phase: PostGenerateCommandPhase.AfterPlanApply,
    ownership: postGenerateCommandOwnership,
  }
}

export function toPostGenerateCommandSpec(command: PostGenerateCommand): PostGenerateCommandSpec {
  return {
    command: command.command.command,
    args: [...command.command.args],
    phase: command.phase,
    ownership: command.ownership,
  }
}

export function buildCommands(config: ProjectConfig) {
  return Effect.gen(function* () {
    const commands: PostGenerateCommand[] = []
    const cli = yield* CliContext
    const commandSvc = yield* CommandService
    const installDeps = cli.args.install
      ?? (!cli.isInteractive ? false : (yield* ask(askInstallDeps)))
    if (config.git) {
      const git = commandSvc.make(makeCommandName('git'), 'init')
      commands.push(traceCommand(git))
    }
    if (config.codeQuality.length > 0) {
      if (!installDeps) {
        const huskyAdd = commandSvc.make(makeCommandName('pnpm'), 'add', '-D', 'husky')
        commands.push(traceCommand(huskyAdd))
      }
      const huskyInit = commandSvc.make(makeCommandName('pnpm'), 'exec', 'husky', 'init')
      commands.push(traceCommand(huskyInit))
      const writePrepareCommitMsg = commandSvc.make(
        makeCommandName('sh'),
        '-c',
        'echo \'[ -n "$2" ] || pnpm exec lobe-commit --hook "$1"\' > .husky/prepare-commit-msg && chmod +x .husky/prepare-commit-msg',
      )
      commands.push(traceCommand(writePrepareCommitMsg))
      // 使用 sh -c 以便支持重定向与 &&
      if (config.codeQuality.includes('lint-staged')) {
        // 覆盖 pre-commit（husky init 已创建且具执行权限，重定向只会截断保持权限）
        const writePreCommit = commandSvc.make(
          makeCommandName('sh'),
          '-c',
          'echo \'pnpm lint-staged\' > .husky/pre-commit',
        )
        commands.push(traceCommand(writePreCommit))
      }
      if (config.codeQuality.includes('commitlint')) {
        // 新建 commit-msg，需要再 chmod +x（首次创建没有执行权限）
        const writeCommitMsg = commandSvc.make(
          makeCommandName('sh'),
          '-c',
          'echo \'pnpm exec commitlint --edit "$1"\' > .husky/commit-msg && chmod +x .husky/commit-msg',
        )
        commands.push(traceCommand(writeCommitMsg))
      }
    }
    if (installDeps) {
      const install = commandSvc.make(makeCommandName('pnpm'), 'install')
      commands.unshift(traceCommand(install))
    }
    return commands
  })
}
