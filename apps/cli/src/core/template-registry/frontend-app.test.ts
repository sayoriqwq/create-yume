import { describe, expect, it } from 'vitest'
import { makeTemplatePath } from '@/brand/template-path'
import { reactPresetProjectConfig } from '../../../tests/support/fixtures'
import {
  assembleFrontendFamilyTemplates,
  getSharedFrontendPresetDefaults,
  sharedFrontendQuestionContracts,
  sharedFrontendTemplates,
  workspaceBootstrapTemplates,
} from './frontend-app'

describe('frontend scaffold-family contract', () => {
  it('keeps scaffold-family preset defaults in one shared contract', () => {
    expect(getSharedFrontendPresetDefaults('react-app')).toEqual({
      buildTool: 'vite',
      cssPreprocessor: 'less',
      cssFramework: 'tailwind',
    })

    expect(getSharedFrontendPresetDefaults('vue-app')).toEqual({
      buildTool: 'vite',
      cssPreprocessor: 'less',
      cssFramework: 'tailwind',
    })
  })

  it('separates shared frontend templates from workspace bootstrap templates', () => {
    expect(Object.keys(sharedFrontendTemplates)).toContain('vite.config.ts')
    expect(Object.keys(sharedFrontendTemplates)).toContain('style.css')
    expect(Object.keys(sharedFrontendTemplates)).not.toContain('eslint.config.mjs')
    expect(Object.keys(sharedFrontendTemplates)).not.toContain('.gitignore')

    expect(Object.keys(workspaceBootstrapTemplates)).toContain('eslint.config.mjs')
    expect(Object.keys(workspaceBootstrapTemplates)).toContain('.gitignore')
    expect(Object.keys(workspaceBootstrapTemplates)).not.toContain('vite.config.ts')
  })

  it('consumes build-tool policy inside the scaffold-family template contract', () => {
    const viteConfig = sharedFrontendTemplates['vite.config.ts']
    const viteEnv = sharedFrontendTemplates['vite-env.d.ts']
    const tsconfigNode = sharedFrontendTemplates['tsconfig.node.json']

    expect(viteConfig.condition(reactPresetProjectConfig)).toBe(true)
    expect(viteEnv.condition(reactPresetProjectConfig)).toBe(true)
    expect(tsconfigNode.condition(reactPresetProjectConfig)).toBe(true)

    const noBuildToolConfig = {
      ...reactPresetProjectConfig,
      buildTool: 'none' as const,
    }

    expect(viteConfig.condition(noBuildToolConfig)).toBe(false)
    expect(viteEnv.condition(noBuildToolConfig)).toBe(false)
    expect(tsconfigNode.condition(noBuildToolConfig)).toBe(false)
  })

  it('assembles family-local templates without reintroducing question ownership', () => {
    const templates = assembleFrontendFamilyTemplates({
      local: {
        template: makeTemplatePath('fragments/react/App.tsx.hbs'),
        target: 'src/local.tsx',
        condition: () => true,
        ownership: {
          owner: 'react-scaffold',
          unit: 'fragment-render',
        },
      },
    })

    expect(Object.keys(templates)).toEqual(expect.arrayContaining([
      'vite.config.ts',
      'eslint.config.mjs',
      'local',
    ]))
    expect(sharedFrontendQuestionContracts.buildTool.options.map(option => option.value)).toEqual(['vite', 'none'])
  })
})
