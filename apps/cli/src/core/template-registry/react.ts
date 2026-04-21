import type { ReactProjectConfig } from '@/types/config'
import type { TemplateRegistry } from '@/types/template'
import { makeTemplatePath } from '@/brand/template-path'
import { commonTemplates } from './frontend-app'

export const ReactTemplates: TemplateRegistry<ReactProjectConfig> = {
  ...commonTemplates,
  'App.tsx': {
    template: makeTemplatePath('fragments/react/App.tsx.hbs'),
    target: config => `src/pages/app.${config.language === 'typescript' ? 'tsx' : 'jsx'}`,
    condition: () => true,
  },

  'About.tsx': {
    template: makeTemplatePath('fragments/react/About.tsx.hbs'),
    target: config => `src/pages/about.${config.language === 'typescript' ? 'tsx' : 'jsx'}`,
    condition: config => config.router !== 'none',
  },

  'Home.tsx': {
    template: makeTemplatePath('fragments/react/Home.tsx.hbs'),
    target: config => `src/pages/home.${config.language === 'typescript' ? 'tsx' : 'jsx'}`,
    condition: () => true,
  },

  'Counter.tsx': {
    template: makeTemplatePath('fragments/react/Counter.tsx.hbs'),
    target: config => `src/components/Counter.${config.language === 'typescript' ? 'tsx' : 'jsx'}`,
    condition: () => true,
  },

  'CounterStore.ts': {
    template: makeTemplatePath('fragments/react/Counter.ts.hbs'),
    target: config => `src/stores/counter.${config.language === 'typescript' ? 'ts' : 'js'}`,
    condition: config => config.stateManagement !== 'none',
  },

  'main.tsx': {
    template: makeTemplatePath('fragments/react/main.tsx.hbs'),
    target: config => `src/main.${config.language === 'typescript' ? 'tsx' : 'jsx'}`,
    condition: () => true,
  },

  'router.ts': {
    template: makeTemplatePath('fragments/react/router.ts.hbs'),
    target: config => `src/router/index.${config.language === 'typescript' ? 'tsx' : 'jsx'}`,
    condition: config => config.router !== 'none',
  },
}
