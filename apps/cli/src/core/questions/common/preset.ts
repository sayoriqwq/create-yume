import type { Preset } from '@/schema/project-config'
import { select } from '@clack/prompts'

export async function askPreset() {
  return await select<Preset>({
    message: 'choose a preset:',
    options: [
      { value: 'react-app', label: 'React App' },
      { value: 'vue-app', label: 'Vue App' },
    ],
  })
}
