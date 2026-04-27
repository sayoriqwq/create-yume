import type { CreateMode } from '@/schema/preset'
import { select } from '@clack/prompts'

export async function askCreateMode() {
  return await select<CreateMode>({
    message: 'Choose create mode:',
    options: [
      { value: 'create', label: 'Create New Project (Custom Configuration)' },
      { value: 'preset', label: 'Use Preset Template (Quick Creation)' },
    ],
  })
}
