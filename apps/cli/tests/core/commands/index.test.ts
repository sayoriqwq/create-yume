import { Effect, Layer } from 'effect'
import { describe, expect, it } from 'vitest'
import { makeProjectName } from '@/brand/project-name'
import { CliContextLive } from '../../../src/core/cli-context'
import { buildCommands, toPostGenerateCommandSpec } from '../../../src/core/commands/index'
import { reactProjectConfig } from '../../support/fixtures'
import { makeCommandMockLayer } from '../../support/mock-layers'

function formatCommand(command: Awaited<ReturnType<typeof collectCommands>>[number]) {
  return `${command.command.command} ${command.command.args.join(' ')}`
}

async function collectCommands(install: boolean) {
  return Effect.runPromise(
    buildCommands(reactProjectConfig).pipe(
      Effect.provide(
        Layer.mergeAll(
          CliContextLive({
            args: {
              preset: 'react-app',
              name: makeProjectName(install ? 'commands-react' : 'commands-react-skip-install'),
              install,
            },
            isInteractive: false,
          }),
          makeCommandMockLayer(),
        ),
      ),
    ),
  )
}

describe('buildCommands', () => {
  it('prepends pnpm install when the non-interactive CLI context requests installation', async () => {
    const commands = await collectCommands(true)

    expect(commands.map(formatCommand)).toEqual([
      'pnpm install',
      'git init',
      'pnpm exec husky init',
      expect.stringContaining('node -e const fs = require("node:fs");fs.writeFileSync(".husky/pre-commit"'),
      expect.stringContaining('node -e const fs = require("node:fs");fs.writeFileSync(".husky/commit-msg"'),
    ])
    expect(commands.map(formatCommand).join('\n')).not.toContain('> .husky/')
    expect(commands.map(formatCommand).join('\n')).not.toContain('prepare-commit-msg')

    expect(commands.map(toPostGenerateCommandSpec)).toEqual([
      {
        command: 'pnpm',
        args: ['install'],
        phase: 'after-plan-apply',
        ownership: {
          owner: 'workspace-bootstrap',
          unit: 'post-generate-command',
        },
      },
      {
        command: 'git',
        args: ['init'],
        phase: 'after-plan-apply',
        ownership: {
          owner: 'workspace-bootstrap',
          unit: 'post-generate-command',
        },
      },
      {
        command: 'pnpm',
        args: ['exec', 'husky', 'init'],
        phase: 'after-plan-apply',
        ownership: {
          owner: 'workspace-bootstrap',
          unit: 'post-generate-command',
        },
      },
      expect.objectContaining({
        command: 'node',
        args: expect.arrayContaining([expect.stringContaining('writeFileSync(".husky/pre-commit"')]),
        phase: 'after-plan-apply',
        ownership: {
          owner: 'workspace-bootstrap',
          unit: 'post-generate-command',
        },
      }),
      expect.objectContaining({
        command: 'node',
        args: expect.arrayContaining([expect.stringContaining('writeFileSync(".husky/commit-msg"')]),
        phase: 'after-plan-apply',
        ownership: {
          owner: 'workspace-bootstrap',
          unit: 'post-generate-command',
        },
      }),
    ])
  })

  it('keeps install fallback and husky bootstrap policy explainable when install is skipped', async () => {
    const commands = await collectCommands(false)

    expect(commands.map(formatCommand)).toEqual([
      'git init',
      'pnpm add -D husky',
      'pnpm exec husky init',
      expect.stringContaining('node -e const fs = require("node:fs");fs.writeFileSync(".husky/pre-commit"'),
      expect.stringContaining('node -e const fs = require("node:fs");fs.writeFileSync(".husky/commit-msg"'),
    ])
    expect(commands.map(formatCommand).join('\n')).not.toContain('> .husky/')
    expect(commands.map(formatCommand).join('\n')).not.toContain('prepare-commit-msg')
  })
})
