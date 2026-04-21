import type { ProjectConfig, ReactProjectConfig, VueProjectConfig } from '../../src/types/config'
import { makeProjectName } from '../../src/brand/project-name'

export const reactProjectConfig = {
  name: makeProjectName('react-fixture'),
  type: 'react',
  language: 'typescript',
  git: true,
  linting: 'antfu-eslint',
  codeQuality: ['lint-staged', 'commitlint'],
  buildTool: 'vite',
  router: 'react-router',
  stateManagement: 'jotai',
  cssPreprocessor: 'less',
  cssFramework: 'tailwind',
} satisfies ReactProjectConfig

export const vueProjectConfig = {
  name: makeProjectName('vue-fixture'),
  type: 'vue',
  language: 'typescript',
  git: true,
  linting: 'antfu-eslint',
  codeQuality: ['lint-staged', 'commitlint'],
  buildTool: 'vite',
  router: true,
  stateManagement: true,
  cssPreprocessor: 'less',
  cssFramework: 'tailwind',
} satisfies VueProjectConfig

export const projectConfigs: readonly ProjectConfig[] = [
  reactProjectConfig,
  vueProjectConfig,
]
