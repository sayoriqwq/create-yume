import type { ContributionTrace } from '../../src/core/ownership/model'
import type { JsonBuilder } from '../../src/core/services/planner'
import { describe, expect, it } from 'vitest'
import {
  applyWorkspaceBootstrapPackageJson,
  getWorkspaceBootstrapCommandSpecs,
  getWorkspaceBootstrapHookSpecs,
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

function huskyHookCommand(path: string, content: string, executable: boolean) {
  return {
    command: 'node',
    args: [
      '-e',
      [
        'const fs = require("node:fs");',
        `fs.writeFileSync(${JSON.stringify(path)}, ${JSON.stringify(content)});`,
        ...(executable ? [`fs.chmodSync(${JSON.stringify(path)}, 0o755);`] : []),
      ].join(''),
    ],
  }
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
      'eslint': '^10.2.1',
      'husky': '^9.1.7',
      'lint-staged': '^16.4.0',
    })
    expect(draft.scripts).toMatchObject({
      'lint': 'eslint',
      'lint:fix': 'eslint --fix',
    })
    expect(draft.scripts).not.toHaveProperty('commit')
    expect(draft.scripts).not.toHaveProperty('commit:config')
    expect(reducers).toHaveLength(5)
    expect(reducers.map(reducer => reducer.ownership)).toEqual(
      Array.from({ length: 5 }).fill(workspaceBootstrapPackageJsonMutation),
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
    expect(reducers).toHaveLength(5)
    expect(reducers.map(reducer => reducer.ownership)).toEqual(
      Array.from({ length: 5 }).fill(workspaceBootstrapPackageJsonMutation),
    )
  })

  it('keeps Husky hook writes structured instead of hidden in shell redirection', () => {
    expect(getWorkspaceBootstrapHookSpecs(reactPresetProjectConfig)).toEqual([
      {
        path: '.husky/pre-commit',
        content: 'pnpm lint-staged\n',
        executable: false,
      },
      {
        path: '.husky/commit-msg',
        content: 'pnpm exec commitlint --edit "$1"\n',
        executable: true,
      },
    ])

    expect(
      getWorkspaceBootstrapCommandSpecs(reactPresetProjectConfig, true)
        .filter(spec => spec.command === 'sh')
        .map(spec => spec.args.join(' ')),
    ).not.toEqual(expect.arrayContaining([
      expect.stringContaining('> .husky/'),
    ]))
  })

  it('keeps command policy in one workspace/bootstrap contract', () => {
    expect(getWorkspaceBootstrapCommandSpecs(reactPresetProjectConfig, true)).toEqual([
      { command: 'pnpm', args: ['install'] },
      { command: 'git', args: ['init'] },
      { command: 'pnpm', args: ['exec', 'husky', 'init'] },
      huskyHookCommand('.husky/pre-commit', 'pnpm lint-staged\n', false),
      huskyHookCommand('.husky/commit-msg', 'pnpm exec commitlint --edit "$1"\n', true),
    ])

    expect(getWorkspaceBootstrapCommandSpecs(reactPresetProjectConfig, false)).toEqual([
      { command: 'git', args: ['init'] },
      { command: 'pnpm', args: ['add', '-D', 'husky'] },
      { command: 'pnpm', args: ['exec', 'husky', 'init'] },
      huskyHookCommand('.husky/pre-commit', 'pnpm lint-staged\n', false),
      huskyHookCommand('.husky/commit-msg', 'pnpm exec commitlint --edit "$1"\n', true),
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
