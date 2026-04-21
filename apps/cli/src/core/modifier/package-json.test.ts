import type { ProjectConfig } from '@/types/config'
import type { ComposeDSL, JsonBuilder } from '@/types/dsl'
import { describe, expect, it } from 'vitest'
import { makeProjectName } from '@/brand/project-name'
import { sortJsonKeys } from '@/utils/file-helper'
import { buildPackageJson } from './package-json'

function renderPackageJson(config: ProjectConfig) {
  let readExisting = false
  let shouldSortKeys = false
  let base: (() => Record<string, unknown>) | undefined
  const reducers: Array<(draft: Record<string, unknown>) => void> = []
  let finalize: ((draft: Record<string, unknown>) => void) | undefined

  const dsl: ComposeDSL = {
    json(path) {
      expect(path).toBe('package.json')

      const builder: JsonBuilder = {
        readExisting(flag) {
          readExisting = flag ?? false
          return builder
        },
        sortKeys(flag) {
          shouldSortKeys = flag ?? false
          return builder
        },
        base(fn) {
          base = fn
          return builder
        },
        merge(patch) {
          reducers.push((draft) => {
            Object.assign(draft, typeof patch === 'function' ? patch(draft) : patch)
          })
          return builder
        },
        modify(fn) {
          reducers.push(fn)
          return builder
        },
        finalize(fn) {
          finalize = fn
          return builder
        },
      }

      return builder
    },
    text() {
      throw new Error('text builder is not used in package-json tests')
    },
    copy() {
      throw new Error('copy is not used in package-json tests')
    },
    render() {
      throw new Error('render is not used in package-json tests')
    },
  }

  buildPackageJson(dsl, config)

  expect(readExisting).toBe(false)
  const draft = base ? base() : {}
  for (const reducer of reducers)
    reducer(draft)
  finalize?.(draft)
  const jsonOutput = shouldSortKeys ? sortJsonKeys(draft) : draft

  if (!jsonOutput)
    throw new Error('package.json was not produced')

  return jsonOutput
}

describe('buildPackageJson', () => {
  it('writes latest common tooling versions for a full react template', () => {
    const packageJson = renderPackageJson({
      type: 'react',
      name: makeProjectName('phase3-react'),
      language: 'typescript',
      git: true,
      linting: 'antfu-eslint',
      codeQuality: ['lint-staged', 'commitlint'],
      buildTool: 'vite',
      router: 'react-router',
      stateManagement: 'zustand',
      cssPreprocessor: 'css',
      cssFramework: 'none',
    })

    expect(packageJson.devDependencies).toMatchObject({
      '@antfu/eslint-config': '^8.2.0',
      '@commitlint/cli': '^20.5.0',
      '@commitlint/config-conventional': '^20.5.0',
      '@lobehub/commit-cli': '^2.19.0',
      'eslint': '^10.2.1',
      'husky': '^9.1.7',
      'lint-staged': '^16.4.0',
      'typescript': '^6.0.3',
    })
  })

  it('writes latest frontend tooling versions when vite and tailwind are enabled', () => {
    const packageJson = renderPackageJson({
      type: 'vue',
      name: makeProjectName('phase3-vue'),
      language: 'typescript',
      git: true,
      linting: 'antfu-eslint',
      codeQuality: ['lint-staged', 'commitlint'],
      buildTool: 'vite',
      router: true,
      stateManagement: true,
      cssPreprocessor: 'less',
      cssFramework: 'tailwind',
    })

    expect(packageJson.dependencies).toMatchObject({
      '@tailwindcss/vite': '^4.2.4',
      'tailwindcss': '^4.2.4',
      'vite': '^8.0.9',
    })

    expect(packageJson.devDependencies).toMatchObject({
      less: '^4.6.4',
    })
  })
})
