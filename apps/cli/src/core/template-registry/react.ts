import type { ReactProjectConfig } from '@/types/config'
import type { TemplateRegistry } from '@/types/template'
import { makeTemplatePath } from '@/brand/template-path'
import { contributionTrace, ContributionUnitKind, ReactScaffoldOwner } from '@/core/ownership/model'
import { ReactRouterAboutTemplate, ReactRouterIndexTemplate } from '../owners/router'
import { ReactCounterStoreTemplate } from '../owners/state-management'
import { commonTemplates } from './frontend-app'

const reactFragmentRender = contributionTrace(ReactScaffoldOwner, ContributionUnitKind.FragmentRender)

export const ReactTemplates: TemplateRegistry<ReactProjectConfig> = {
  ...commonTemplates,
  'App.tsx': {
    template: makeTemplatePath('fragments/react/App.tsx.hbs'),
    target: config => `src/pages/app.${config.language === 'typescript' ? 'tsx' : 'jsx'}`,
    condition: () => true,
    ownership: reactFragmentRender,
  },

  'router-about.tsx': ReactRouterAboutTemplate,

  'Home.tsx': {
    template: makeTemplatePath('fragments/react/Home.tsx.hbs'),
    target: config => `src/pages/home.${config.language === 'typescript' ? 'tsx' : 'jsx'}`,
    condition: () => true,
    ownership: reactFragmentRender,
  },

  'Counter.tsx': {
    template: makeTemplatePath('fragments/react/Counter.tsx.hbs'),
    target: config => `src/components/Counter.${config.language === 'typescript' ? 'tsx' : 'jsx'}`,
    condition: () => true,
    ownership: reactFragmentRender,
  },

  'CounterStore.ts': ReactCounterStoreTemplate,

  'main.tsx': {
    template: makeTemplatePath('fragments/react/main.tsx.hbs'),
    target: config => `src/main.${config.language === 'typescript' ? 'tsx' : 'jsx'}`,
    condition: () => true,
    ownership: reactFragmentRender,
  },

  'router.ts': ReactRouterIndexTemplate,
}
