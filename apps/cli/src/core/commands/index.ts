import type { StandardCommand } from '@effect/platform/Command'
import type { ProjectConfig } from '@/types/config'
import { Effect } from 'effect'
import { ask } from '../adapters/prompts'
import { askInstallDeps } from '../questions/common/install-deps'
import { CommandService } from '../services/command'

export function buildCommands(config: ProjectConfig) {
  return Effect.gen(function* () {
    const commands: StandardCommand[] = []
    const commandSvc = yield* CommandService
    const installDeps = yield* ask(askInstallDeps)
    if (config.git) {
      const git = commandSvc.make('git', 'init')
      commands.push(git)
    }
    if (config.codeQuality.length > 0) {
      if (!installDeps) {
        const huskyAdd = commandSvc.make('pnpm', 'add', '-D', 'husky')
        commands.push(huskyAdd)
      }
      const huskyInit = commandSvc.make('pnpm', 'exec', 'husky', 'init')
      commands.push(huskyInit)
      const writePrepareCommitMsg = commandSvc.make(
        'sh',
        '-c',
        'echo \'[ -n "$2" ] || pnpm exec lobe-commit --hook "$1"\' > .husky/prepare-commit-msg && chmod +x .husky/prepare-commit-msg',
      )
      commands.push(writePrepareCommitMsg)
      // 使用 sh -c 以便支持重定向与 &&
      if (config.codeQuality.includes('lint-staged')) {
        // 覆盖 pre-commit（husky init 已创建且具执行权限，重定向只会截断保持权限）
        const writePreCommit = commandSvc.make(
          'sh',
          '-c',
          'echo \'pnpm lint-staged\' > .husky/pre-commit',
        )
        commands.push(writePreCommit)
      }
      if (config.codeQuality.includes('commitlint')) {
        // 新建 commit-msg，需要再 chmod +x（首次创建没有执行权限）
        const writeCommitMsg = commandSvc.make(
          'sh',
          '-c',
          'echo \'pnpm exec commitlint --edit "$1"\' > .husky/commit-msg && chmod +x .husky/commit-msg',
        )
        commands.push(writeCommitMsg)
      }
    }
    if (installDeps) {
      const install = commandSvc.make('pnpm', 'install')
      commands.unshift(install)
    }
    return commands
  })
}
