import type { StandardCommand } from '@effect/platform/Command'
import path from 'node:path'
import { Command } from '@effect/platform'
import { Effect, Layer, Option } from 'effect'
import { describe, expect, it } from 'vitest'
import { makeProjectName } from '@/brand/project-name'
import { makeTargetDir } from '@/brand/target-dir'
import { makeTemplatePath } from '@/brand/template-path'
import { contributionTrace, ContributionUnitKind, WorkspaceBootstrapOwner } from '@/core/ownership/model'
import { makeCommandMockLayer } from '../../../tests/support/mock-layers'
import { collectPartialEntries, executeAllCommandsInDir, toTracedPlanSpec, withWorkingDirectory } from './compose'

describe('collectPartialEntries', () => {
  const partialRoot = makeTemplatePath('/tmp/create-yume/templates/partials')

  it('registers react partials with an explicit global namespace directory', () => {
    const entries = collectPartialEntries({
      type: 'react',
      name: makeProjectName('phase2-react'),
      language: 'typescript',
      git: true,
      linting: 'antfu-eslint',
      codeQuality: ['lint-staged'],
      buildTool: 'vite',
      router: 'react-router',
      stateManagement: 'zustand',
      cssPreprocessor: 'css',
      cssFramework: 'none',
    }, partialRoot)

    expect(entries).toEqual([
      {
        dir: makeTemplatePath(path.join(partialRoot, 'react')),
        namespace: 'react',
        ownership: {
          owner: 'react-scaffold',
          unit: 'partial-namespace',
        },
      },
      {
        dir: makeTemplatePath(path.join(partialRoot, 'global')),
        namespace: 'global',
        ownership: {
          owner: 'frontend-scaffold',
          unit: 'partial-namespace',
        },
      },
    ])
  })

  it('registers vue partials with an explicit global namespace directory', () => {
    const entries = collectPartialEntries({
      type: 'vue',
      name: makeProjectName('phase2-vue'),
      language: 'typescript',
      git: true,
      linting: 'antfu-eslint',
      codeQuality: ['commitlint'],
      buildTool: 'vite',
      router: true,
      stateManagement: true,
      cssPreprocessor: 'sass',
      cssFramework: 'tailwind',
    }, partialRoot)

    expect(entries).toEqual([
      {
        dir: makeTemplatePath(path.join(partialRoot, 'vue')),
        namespace: 'vue',
        ownership: {
          owner: 'vue-scaffold',
          unit: 'partial-namespace',
        },
      },
      {
        dir: makeTemplatePath(path.join(partialRoot, 'global')),
        namespace: 'global',
        ownership: {
          owner: 'frontend-scaffold',
          unit: 'partial-namespace',
        },
      },
    ])
  })
})

describe('command working directory helpers', () => {
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

  it('attaches post-generate commands into the final traced plan spec', () => {
    const ownership = contributionTrace(WorkspaceBootstrapOwner, ContributionUnitKind.PostGenerateCommand)

    const tracedPlanSpec = toTracedPlanSpec(
      { tasks: [] },
      [
        {
          command: Command.make('pnpm', 'install') as StandardCommand,
          phase: 'after-plan-apply',
          ownership,
        },
      ],
    )

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
})
