import { beforeEach, describe, expect, it, vi } from 'vitest'
import { workspaceBootstrapQuestionContracts } from '@/core/workspace-bootstrap'
import { askCodeQuality } from './code-quality'
import { askGit } from './git'
import { askLinting } from './linting'

const { confirm, multiselect, select } = vi.hoisted(() => ({
  confirm: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
}))

vi.mock('@clack/prompts', () => ({
  confirm,
  select,
  multiselect,
}))

describe('workspace/bootstrap question wrappers', () => {
  beforeEach(() => {
    confirm.mockReset()
    select.mockReset()
    multiselect.mockReset()
  })

  it('delegates git prompts to the workspace/bootstrap contract', async () => {
    confirm.mockResolvedValue(true)

    const result = await askGit()

    expect(result).toBe(true)
    expect(confirm).toHaveBeenCalledWith({
      message: workspaceBootstrapQuestionContracts.git.message,
      initialValue: workspaceBootstrapQuestionContracts.git.initialValue,
    })
  })

  it('delegates linting options to the workspace/bootstrap contract', async () => {
    select.mockResolvedValue('antfu-eslint')

    const result = await askLinting()

    expect(result).toBe('antfu-eslint')
    expect(select).toHaveBeenCalledWith({
      message: workspaceBootstrapQuestionContracts.linting.message,
      options: [...workspaceBootstrapQuestionContracts.linting.options],
    })
  })

  it('delegates code-quality options to the workspace/bootstrap contract', async () => {
    multiselect.mockResolvedValue(['lint-staged'])

    const result = await askCodeQuality()

    expect(result).toEqual(['lint-staged'])
    expect(multiselect).toHaveBeenCalledWith({
      message: workspaceBootstrapQuestionContracts.codeQuality.message,
      required: workspaceBootstrapQuestionContracts.codeQuality.required,
      options: [...workspaceBootstrapQuestionContracts.codeQuality.options],
    })
  })
})
