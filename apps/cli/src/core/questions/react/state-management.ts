import type { ReactStateManagement } from '@/types/project'
import { select } from '@clack/prompts'
import { reactStateManagementOptions } from '@/core/owners/state-management'

export async function askReactStateManagement() {
  return await select<ReactStateManagement>({
    message: 'choose state management:',
    options: reactStateManagementOptions,
  })
}
