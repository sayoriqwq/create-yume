import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sharedFrontendQuestionContracts } from '@/core/template-registry/frontend-app'
import { askBuildTool } from '../../../../src/core/questions/frontend/build-tool'
import { askCSSFramework } from '../../../../src/core/questions/frontend/css-framework'
import { askCSSPreprocessor } from '../../../../src/core/questions/frontend/css-preprocessor'

const { select } = vi.hoisted(() => ({
  select: vi.fn(),
}))

vi.mock('@clack/prompts', () => ({
  select,
}))

describe('shared frontend leaf question wrappers', () => {
  beforeEach(() => {
    select.mockReset()
  })

  it('delegates build tool options to the scaffold-family contract', async () => {
    select.mockResolvedValue('vite')

    const result = await askBuildTool()

    expect(result).toBe('vite')
    expect(select).toHaveBeenCalledWith({
      message: sharedFrontendQuestionContracts.buildTool.message,
      options: [...sharedFrontendQuestionContracts.buildTool.options],
    })
  })

  it('delegates css preprocessor options to the scaffold-family contract', async () => {
    select.mockResolvedValue('sass')

    const result = await askCSSPreprocessor()

    expect(result).toBe('sass')
    expect(select).toHaveBeenCalledWith({
      message: sharedFrontendQuestionContracts.cssPreprocessor.message,
      options: [...sharedFrontendQuestionContracts.cssPreprocessor.options],
    })
  })

  it('delegates css framework options to the scaffold-family contract', async () => {
    select.mockResolvedValue('tailwind')

    const result = await askCSSFramework()

    expect(result).toBe('tailwind')
    expect(select).toHaveBeenCalledWith({
      message: sharedFrontendQuestionContracts.cssFramework.message,
      options: [...sharedFrontendQuestionContracts.cssFramework.options],
    })
  })
})
