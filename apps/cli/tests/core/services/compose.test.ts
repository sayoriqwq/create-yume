import type { StandardCommand } from '@effect/platform/Command'
import { readFileSync } from 'node:fs'
import { Command } from '@effect/platform'
import { Effect, Layer, Option } from 'effect'
import { describe, expect, it } from 'vitest'
import { makeProjectName } from '@/brand/project-name'
import { makeTargetDir } from '@/brand/target-dir'
import { CommandError } from '@/core/errors'
import { contributionTrace, ContributionUnitKind, WorkspaceBootstrapOwner } from '@/core/ownership/model'
import { executeAllCommandsInDir, finishProject, withWorkingDirectory } from '../../../src/core/services/compose'
import { toPlanSpec } from '../../../src/core/services/planner'
import { makeCommandMockLayer, makeFsMockLayer } from '../../support/mock-layers'

describe('command working directory helpers', () => {
  it('keeps finishProject project annotations distinct from command execution annotations', () => {
    const source = readFileSync(new URL('../../../src/core/services/compose.ts', import.meta.url), 'utf8')

    expect(source).toContain('Effect.withSpan(\'finish.project\')')
    expect(source).toContain('withProjectAnnotations(config, \'finish.project\'')
    expect(source).toContain('commandOwner: command.ownership.owner')
    expect(source).toContain('commandUnit: command.ownership.unit')
    expect(source).toContain('commandPhase: command.phase')
    expect(source).not.toContain('withProjectAnnotations(config, \'command.execute\'')
  })

  it('applies the target directory through Command.workingDirectory', () => {
    const command = Command.make('pnpm', 'install') as StandardCommand
    const targetDir = makeTargetDir('/tmp/create-yume-working-dir')

    const located = withWorkingDirectory(command, targetDir)

    expect(Option.isSome(located.cwd)).toBe(true)
    if (Option.isSome(located.cwd)) {
      expect(located.cwd.value).toBe(targetDir)
    }
  })

  it('executes every command with the provided working directory', async () => {
    const commands = [
      {
        command: Command.make('pnpm', 'install') as StandardCommand,
        phase: 'after-plan-apply' as const,
        ownership: contributionTrace(WorkspaceBootstrapOwner, ContributionUnitKind.PostGenerateCommand),
      },
      {
        command: Command.make('git', 'status') as StandardCommand,
        phase: 'after-plan-apply' as const,
        ownership: contributionTrace(WorkspaceBootstrapOwner, ContributionUnitKind.PostGenerateCommand),
      },
    ]
    const targetDir = makeTargetDir('/tmp/create-yume-execute-dir')
    const executed: Array<{ command: string, cwd?: string }> = []

    await Effect.runPromise(
      executeAllCommandsInDir(commands, targetDir).pipe(
        Effect.provide(
          Layer.mergeAll(
            makeFsMockLayer(),
            makeCommandMockLayer({
              execute: (command) => {
                executed.push({
                  command: `${command.command} ${command.args.join(' ')}`,
                  ...(Option.isSome(command.cwd) ? { cwd: command.cwd.value } : {}),
                })
                return Effect.succeed('')
              },
            }),
          ),
        ),
      ),
    )

    expect(executed).toEqual([
      { command: 'pnpm install', cwd: targetDir },
      { command: 'git status', cwd: targetDir },
    ])
  })

  it('serializes post-generate commands from the actual plan model', () => {
    const ownership = contributionTrace(WorkspaceBootstrapOwner, ContributionUnitKind.PostGenerateCommand)

    const tracedPlanSpec = toPlanSpec({
      tasks: [],
      postGenerateCommands: [
        {
          command: Command.make('pnpm', 'install') as StandardCommand,
          phase: 'after-plan-apply',
          ownership,
        },
      ],
    })

    expect(tracedPlanSpec).toEqual({
      tasks: [],
      postGenerateCommands: [
        {
          command: 'pnpm',
          args: ['install'],
          phase: 'after-plan-apply',
          ownership,
        },
      ],
    })
  })

  it('executes post-generate commands from the emitted plan', async () => {
    const targetDir = makeTargetDir('./phase2-plan-commands')
    const executed: Array<{ command: string, cwd?: string }> = []

    await Effect.runPromise(
      finishProject(
        {
          type: 'react',
          name: makeProjectName('phase2-plan-commands'),
          language: 'typescript',
          git: true,
          linting: 'antfu-eslint',
          codeQuality: ['lint-staged'],
          buildTool: 'vite',
          router: 'react-router',
          stateManagement: 'zustand',
          cssPreprocessor: 'css',
          cssFramework: 'none',
        },
        {
          tasks: [],
          postGenerateCommands: [
            {
              command: Command.make('pnpm', 'install') as StandardCommand,
              phase: 'after-plan-apply',
              ownership: contributionTrace(WorkspaceBootstrapOwner, ContributionUnitKind.PostGenerateCommand),
            },
          ],
        },
      ).pipe(
        Effect.provide(
          Layer.mergeAll(
            makeFsMockLayer(),
            makeCommandMockLayer({
              execute: (command) => {
                executed.push({
                  command: `${command.command} ${command.args.join(' ')}`,
                  ...(Option.isSome(command.cwd) ? { cwd: command.cwd.value } : {}),
                })
                return Effect.succeed('')
              },
            }),
          ),
        ),
      ),
    )

    expect(executed).toEqual([
      { command: 'pnpm install', cwd: targetDir },
    ])
  })

  it('rolls back the generated project when a post-generate command fails', async () => {
    const targetDir = makeTargetDir('./post-command-failure')
    const removes: string[] = []

    const exit = await Effect.runPromiseExit(
      finishProject(
        {
          type: 'react',
          name: makeProjectName('post-command-failure'),
          language: 'typescript',
          git: true,
          linting: 'antfu-eslint',
          codeQuality: ['lint-staged'],
          buildTool: 'vite',
          router: 'react-router',
          stateManagement: 'zustand',
          cssPreprocessor: 'css',
          cssFramework: 'none',
        },
        {
          tasks: [],
          postGenerateCommands: [
            {
              command: Command.make('git', 'init') as StandardCommand,
              phase: 'after-plan-apply',
              ownership: contributionTrace(WorkspaceBootstrapOwner, ContributionUnitKind.PostGenerateCommand),
            },
          ],
        },
      ).pipe(
        Effect.provide(
          Layer.mergeAll(
            makeFsMockLayer({
              remove: path =>
                Effect.sync(() => {
                  removes.push(path)
                }),
            }),
            makeCommandMockLayer({
              execute: command =>
                Effect.fail(new CommandError({
                  command: command.command,
                  args: [...command.args],
                })),
            }),
          ),
        ),
      ),
    )

    expect(exit._tag).toBe('Failure')
    expect(removes).toEqual([targetDir])
  })
})
