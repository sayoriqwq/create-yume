import type { Language } from '@/schema/project-config'
import { select } from '@clack/prompts'

export async function askLanguage() {
  return await select<Language>({
    message: 'choose programming language:',
    options: [
      { value: 'typescript', label: 'TypeScript' },
      { value: 'javascript', label: 'JavaScript' },
    ],
  })
}
