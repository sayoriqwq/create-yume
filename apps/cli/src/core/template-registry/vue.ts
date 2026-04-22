import type { VueProjectConfig } from '@/types/config'
import type { TemplateRegistry } from '@/types/template'
import { makeTemplatePath } from '@/brand/template-path'
import { contributionTrace, ContributionUnitKind, VueScaffoldOwner } from '@/core/ownership/model'
import { VueRouterAboutTemplate, VueRouterIndexTemplate } from '../owners/router'
import { VueCounterStoreTemplate } from '../owners/state-management'
import { assembleFrontendFamilyTemplates } from './frontend-app'

const vueFragmentRender = contributionTrace(VueScaffoldOwner, ContributionUnitKind.FragmentRender)

const vueFamilyTemplates: TemplateRegistry<VueProjectConfig> = {
  'main.ts': {
    template: makeTemplatePath('fragments/vue/main.ts.hbs'),
    target: config => `src/main.${config.language === 'typescript' ? 'ts' : 'js'}`,
    condition: () => true,
    ownership: vueFragmentRender,
  },

  'App.vue': {
    template: makeTemplatePath('fragments/vue/App.vue.hbs'),
    target: 'src/App.vue',
    condition: () => true,
    ownership: vueFragmentRender,
  },

  'Counter.vue': {
    template: makeTemplatePath('fragments/vue/Counter.vue.hbs'),
    target: 'src/components/Counter.vue',
    condition: () => true,
    ownership: vueFragmentRender,
  },

  'router.ts': VueRouterIndexTemplate,

  'Home.vue': {
    template: makeTemplatePath('fragments/vue/Home.vue.hbs'),
    target: 'src/views/Home.vue',
    condition: () => true,
    ownership: vueFragmentRender,
  },

  'router-about.vue': VueRouterAboutTemplate,

  'counter-store.ts': VueCounterStoreTemplate,
}

export const VueTemplates: TemplateRegistry<VueProjectConfig> = assembleFrontendFamilyTemplates(vueFamilyTemplates)
