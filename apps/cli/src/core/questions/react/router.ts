import type { ReactRouter } from '@/types/project'
import { select } from '@clack/prompts'
import { reactRouterOptions } from '@/core/owners/router'

export async function askReactRouter() {
  return await select<ReactRouter>({
    message: 'select a router?',
    options: reactRouterOptions,
  })
}
