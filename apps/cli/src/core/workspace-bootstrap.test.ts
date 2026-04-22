import { describe, expect, it } from 'vitest'
import { reactPresetProjectConfig } from '../../tests/support/fixtures'
import {
  getWorkspaceBootstrapCommandSpecs,
  getWorkspaceBootstrapPresetDefaults,
  resolveWorkspaceBootstrapInstallPolicy,
  workspaceBootstrapQuestionContracts,
} from './workspace-bootstrap'

describe('workspace/bootstrap contract', () => {
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

  it('keeps command policy in one workspace/bootstrap contract', () => {
    expect(getWorkspaceBootstrapCommandSpecs(reactPresetProjectConfig, true)).toEqual([
      { command: 'pnpm', args: ['install'] },
      { command: 'git', args: ['init'] },
      { command: 'pnpm', args: ['exec', 'husky', 'init'] },
      { command: 'sh', args: ['-c', 'echo \'[ -n "$2" ] || pnpm exec lobe-commit --hook "$1"\' > .husky/prepare-commit-msg && chmod +x .husky/prepare-commit-msg'] },
      { command: 'sh', args: ['-c', 'echo \'pnpm lint-staged\' > .husky/pre-commit'] },
      { command: 'sh', args: ['-c', 'echo \'pnpm exec commitlint --edit "$1"\' > .husky/commit-msg && chmod +x .husky/commit-msg'] },
    ])

    expect(workspaceBootstrapQuestionContracts.codeQuality.options.map(option => option.value)).toEqual([
      'lint-staged',
      'commitlint',
    ])
  })
})
