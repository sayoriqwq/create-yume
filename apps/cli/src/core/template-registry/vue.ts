import type { VueProjectConfig } from '@/types/config'
import type { TemplateRegistry } from '@/types/template'
import { makeTemplatePath } from '@/brand/template-path'
import { commonTemplates } from './frontend-app'

export const VueTemplates: TemplateRegistry<VueProjectConfig> = {
  ...commonTemplates,
  'main.ts': {
    template: makeTemplatePath('fragments/vue/main.ts.hbs'),
    target: config => `src/main.${config.language === 'typescript' ? 'ts' : 'js'}`,
    condition: () => true,
  },

  'App.vue': {
    template: makeTemplatePath('fragments/vue/App.vue.hbs'),
    target: 'src/App.vue',
    condition: () => true,
  },

  'Counter.vue': {
    template: makeTemplatePath('fragments/vue/Counter.vue.hbs'),
    target: 'src/components/Counter.vue',
    condition: () => true,
  },

  'router.ts': {
    template: makeTemplatePath('fragments/vue/router.ts.hbs'),
    target: config => `src/router/index.${config.language === 'typescript' ? 'ts' : 'js'}`,
    condition: config => config.router === true,
  },

  'Home.vue': {
    template: makeTemplatePath('fragments/vue/Home.vue.hbs'),
    target: 'src/views/Home.vue',
    condition: () => true,
  },

  'About.vue': {
    template: makeTemplatePath('fragments/vue/About.vue.hbs'),
    target: 'src/views/About.vue',
    condition: config => config.router === true,
  },

  'counter-store.ts': {
    template: makeTemplatePath('fragments/vue/counter-store.ts.hbs'),
    target: config => `src/stores/counter.${config.language === 'typescript' ? 'ts' : 'js'}`,
    condition: config => config.stateManagement,
  },
}
