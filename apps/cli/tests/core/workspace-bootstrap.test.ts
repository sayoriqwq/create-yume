import type { ContributionTrace } from '../../src/core/ownership/model'
import type { JsonBuilder } from '../../src/core/services/planner'
import { describe, expect, it } from 'vitest'
import {
  applyWorkspaceBootstrapPackageJson,
  getWorkspaceBootstrapCommandSpecs,
  getWorkspaceBootstrapPresetDefaults,
  resolveWorkspaceBootstrapInstallPolicy,
  shouldAskWorkspaceBootstrapCodeQuality,
  workspaceBootstrapPackageJsonMutation,
  workspaceBootstrapQuestionContracts,
} from '../../src/core/workspace-bootstrap'
import { reactPresetProjectConfig } from '../support/fixtures'

function applyWorkspacePackageMutations(config: Parameters<typeof applyWorkspaceBootstrapPackageJson>[1]) {
  const reducers: Array<{
    readonly reducer: (draft: Record<string, unknown>) => void
    readonly ownership: ContributionTrace | undefined
  }> = []

  const builder: JsonBuilder = {
    readExisting() {
      return builder
    },
    sortKeys() {
      return builder
    },
    base() {
      return builder
    },
    merge(_patch, ownership) {
      reducers.push({
        reducer: draft => Object.assign(draft, typeof _patch === 'function' ? _patch(draft) : _patch),
        ownership,
      })
      return builder
    },
    modify(fn, ownership) {
      reducers.push({ reducer: fn, ownership })
      return builder
    },
    finalize() {
      return builder
    },
  }

  applyWorkspaceBootstrapPackageJson(builder, config)

  const draft: Record<string, unknown> = {
    scripts: {},
    devDependencies: {},
  }

  for (const { reducer } of reducers) {
    reducer(draft)
  }

  return { draft, reducers }
}

describe('workspace/bootstrap contract', () => {
  it('keeps code-quality prompts gated by git and linting choices', () => {
    expect(shouldAskWorkspaceBootstrapCodeQuality({
      git: true,
      linting: 'antfu-eslint',
    })).toBe(true)

    expect(shouldAskWorkspaceBootstrapCodeQuality({
      git: false,
      linting: 'antfu-eslint',
    })).toBe(false)

    expect(shouldAskWorkspaceBootstrapCodeQuality({
      git: true,
      linting: 'none',
    })).toBe(false)
  })

  it('keeps preset defaults in one shared contract', () => {
    expect(getWorkspaceBootstrapPresetDefaults(true)).toEqual({
      linting: 'antfu-eslint',
      codeQuality: ['lint-staged', 'commitlint'],
    })

    expect(getWorkspaceBootstrapPresetDefaults(false)).toEqual({
      linting: 'antfu-eslint',
      codeQuality: [],
    })
  })

  it('encodes install policy centrally', () => {
    expect(resolveWorkspaceBootstrapInstallPolicy({
      cliInstallArg: true,
      isInteractive: false,
    })).toBe(true)

    expect(resolveWorkspaceBootstrapInstallPolicy({
      cliInstallArg: false,
      isInteractive: true,
    })).toBe(false)

    expect(resolveWorkspaceBootstrapInstallPolicy({
      cliInstallArg: undefined,
      isInteractive: true,
    })).toBe('prompt')

    expect(resolveWorkspaceBootstrapInstallPolicy({
      cliInstallArg: undefined,
      isInteractive: false,
    })).toBe(false)
  })

  it('applies package mutations with workspace ownership metadata', () => {
    const { draft, reducers } = applyWorkspacePackageMutations(reactPresetProjectConfig)

    expect(draft.devDependencies).toMatchObject({
      '@antfu/eslint-config': '^8.2.0',
      '@commitlint/cli': '^20.5.0',
      '@commitlint/config-conventional': '^20.5.0',
      '@lobehub/commit-cli': '^2.19.0',
      'eslint': '^10.2.1',
      'husky': '^9.1.7',
      'lint-staged': '^16.4.0',
    })
    expect(draft.scripts).toMatchObject({
      'commit': 'lobe-commit --hook',
      'commit:config': 'lobe-commit --option',
      'lint': 'eslint',
      'lint:fix': 'eslint --fix',
    })
    expect(reducers).toHaveLength(7)
    expect(reducers.map(reducer => reducer.ownership)).toEqual(
      Array.from({ length: 7 }).fill(workspaceBootstrapPackageJsonMutation),
    )
  })

  it('keeps disabled package mutations as no-op workspace policy reducers', () => {
    const { draft, reducers } = applyWorkspacePackageMutations({
      git: false,
      linting: 'none',
      codeQuality: [],
    })

    expect(draft.devDependencies).toEqual({})
    expect(draft.scripts).toEqual({})
    expect(reducers).toHaveLength(7)
    expect(reducers.map(reducer => reducer.ownership)).toEqual(
      Array.from({ length: 7 }).fill(workspaceBootstrapPackageJsonMutation),
    )
  })

  it('keeps command policy in one workspace/bootstrap contract', () => {
    expect(getWorkspaceBootstrapCommandSpecs(reactPresetProjectConfig, true)).toEqual([
      { command: 'pnpm', args: ['install'] },
      { command: 'git', args: ['init'] },
      { command: 'pnpm', args: ['exec', 'husky', 'init'] },
      { command: 'sh', args: ['-c', 'echo \'[ -n "$2" ] || pnpm exec lobe-commit --hook "$1"\' > .husky/prepare-commit-msg && chmod +x .husky/prepare-commit-msg'] },
      { command: 'sh', args: ['-c', 'echo \'pnpm lint-staged\' > .husky/pre-commit'] },
      { command: 'sh', args: ['-c', 'echo \'pnpm exec commitlint --edit "$1"\' > .husky/commit-msg && chmod +x .husky/commit-msg'] },
    ])

    expect(getWorkspaceBootstrapCommandSpecs(reactPresetProjectConfig, false)).toEqual([
      { command: 'git', args: ['init'] },
      { command: 'pnpm', args: ['add', '-D', 'husky'] },
      { command: 'pnpm', args: ['exec', 'husky', 'init'] },
      { command: 'sh', args: ['-c', 'echo \'[ -n "$2" ] || pnpm exec lobe-commit --hook "$1"\' > .husky/prepare-commit-msg && chmod +x .husky/prepare-commit-msg'] },
      { command: 'sh', args: ['-c', 'echo \'pnpm lint-staged\' > .husky/pre-commit'] },
      { command: 'sh', args: ['-c', 'echo \'pnpm exec commitlint --edit "$1"\' > .husky/commit-msg && chmod +x .husky/commit-msg'] },
    ])

    expect(getWorkspaceBootstrapCommandSpecs({
      ...reactPresetProjectConfig,
      git: false,
      codeQuality: [],
    }, false)).toEqual([])

    expect(workspaceBootstrapQuestionContracts.codeQuality.options.map(option => option.value)).toEqual([
      'lint-staged',
      'commitlint',
    ])
  })
})
