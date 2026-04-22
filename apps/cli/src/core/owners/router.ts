import type { ReactProjectConfig, VueProjectConfig } from '@/types/config'
import type { JsonBuilder } from '@/types/dsl'
import type { ReactRouter } from '@/types/project'
import type { TemplateRegistryEntry } from '@/types/template'
import { makeTemplatePath } from '@/brand/template-path'
import { contributionTrace, ContributionUnitKind, defineOwner, OwnershipLayer } from '@/core/ownership/model'
import { deps } from '@/utils/file-helper'

export const RouterOwner = defineOwner({
  id: 'router',
  layer: OwnershipLayer.Capability,
  label: 'Router Capability',
})

export const routerFragmentRender = contributionTrace(RouterOwner, ContributionUnitKind.FragmentRender)
export const routerPackageJsonMutation = contributionTrace(RouterOwner, ContributionUnitKind.JsonTextMutation)

export const reactRouterOptions: Array<{ value: ReactRouter, label: string }> = [
  { value: 'react-router', label: 'React Router' },
  { value: 'tanstack-router', label: 'TanStack Router' },
  { value: 'none', label: 'No Router' },
]

export function hasReactRouter(config: ReactProjectConfig): boolean {
  return config.router !== 'none'
}

export function hasVueRouter(config: VueProjectConfig): boolean {
  return config.router === true
}

export const ReactRouterAboutTemplate: TemplateRegistryEntry<ReactProjectConfig> = {
  template: makeTemplatePath('fragments/react/About.tsx.hbs'),
  target: config => `src/pages/about.${config.language === 'typescript' ? 'tsx' : 'jsx'}`,
  condition: hasReactRouter,
  ownership: routerFragmentRender,
}

export const ReactRouterIndexTemplate: TemplateRegistryEntry<ReactProjectConfig> = {
  template: makeTemplatePath('fragments/react/router.ts.hbs'),
  target: config => `src/router/index.${config.language === 'typescript' ? 'tsx' : 'jsx'}`,
  condition: hasReactRouter,
  ownership: routerFragmentRender,
}

export const VueRouterIndexTemplate: TemplateRegistryEntry<VueProjectConfig> = {
  template: makeTemplatePath('fragments/vue/router.ts.hbs'),
  target: config => `src/router/index.${config.language === 'typescript' ? 'ts' : 'js'}`,
  condition: hasVueRouter,
  ownership: routerFragmentRender,
}

export const VueRouterAboutTemplate: TemplateRegistryEntry<VueProjectConfig> = {
  template: makeTemplatePath('fragments/vue/About.vue.hbs'),
  target: 'src/views/About.vue',
  condition: hasVueRouter,
  ownership: routerFragmentRender,
}

export function applyReactRouterPackageJson(entry: JsonBuilder, config: ReactProjectConfig): JsonBuilder {
  if (config.router === 'react-router') {
    return entry.modify(deps({ 'react-router': '^7.14.2', 'react-router-dom': '^7.14.2' }), routerPackageJsonMutation)
  }
  if (config.router === 'tanstack-router') {
    return entry.modify(deps({ '@tanstack/react-router': '^1.168.23' }), routerPackageJsonMutation)
  }
  return entry
}

export function applyVueRouterPackageJson(entry: JsonBuilder, config: VueProjectConfig): JsonBuilder {
  return config.router ? entry.modify(deps({ 'vue-router': '^5.0.4' }), routerPackageJsonMutation) : entry
}
