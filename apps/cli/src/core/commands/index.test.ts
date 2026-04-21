import { Effect, Layer } from 'effect'
import { describe, expect, it } from 'vitest'
import { makeProjectName } from '@/brand/project-name'
import { reactProjectConfig } from '../../../tests/support/fixtures'
import { makeCommandMockLayer } from '../../../tests/support/mock-layers'
import { CliContextLive } from '../cli-context'
import { buildCommands } from './index'

describe('buildCommands', () => {
  it('prepends pnpm install when the non-interactive CLI context requests installation', async () => {
    const commands = await Effect.runPromise(
      buildCommands(reactProjectConfig).pipe(
        Effect.provide(
          Layer.mergeAll(
            CliContextLive({
              args: {
                preset: 'react-app',
                name: makeProjectName('commands-react'),
                install: true,
              },
              isInteractive: false,
            }),
            makeCommandMockLayer(),
          ),
        ),
      ),
    )

    expect(commands.map(command => `${command.command} ${command.args.join(' ')}`)).toEqual([
      'pnpm install',
      'git init',
      'pnpm exec husky init',
      'sh -c echo \'[ -n "$2" ] || pnpm exec lobe-commit --hook "$1"\' > .husky/prepare-commit-msg && chmod +x .husky/prepare-commit-msg',
      'sh -c echo \'pnpm lint-staged\' > .husky/pre-commit',
      'sh -c echo \'pnpm exec commitlint --edit "$1"\' > .husky/commit-msg && chmod +x .husky/commit-msg',
    ])
  })
})
