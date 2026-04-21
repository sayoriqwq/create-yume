import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { makeProjectName } from '@/brand/project-name'
import { makeTemplatePath } from '@/brand/template-path'
import { collectPartialEntries } from './compose'

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
      },
      {
        dir: makeTemplatePath(path.join(partialRoot, 'global')),
        namespace: 'global',
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
      },
      {
        dir: makeTemplatePath(path.join(partialRoot, 'global')),
        namespace: 'global',
      },
    ])
  })
})
