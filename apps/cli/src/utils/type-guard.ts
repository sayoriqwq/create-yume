import type { ProjectConfig, ReactProjectConfig, VueProjectConfig } from '@/schema/project-config'

export function isVueProject(config: ProjectConfig): config is VueProjectConfig {
  return (config as VueProjectConfig).type === 'vue'
}

export function isReactProject(config: ProjectConfig): config is ReactProjectConfig {
  return (config as ReactProjectConfig).type === 'react'
}

export function isFrontendProject(config: ProjectConfig): config is VueProjectConfig | ReactProjectConfig {
  return isVueProject(config) || isReactProject(config)
}
