import type { CSSFramework } from '@/types/project'
import { select } from '@clack/prompts'
import { sharedFrontendQuestionContracts } from '@/core/template-registry/frontend-app'

export async function askCSSFramework() {
  const contract = sharedFrontendQuestionContracts.cssFramework
  return await select<CSSFramework>({
    message: contract.message,
    options: [...contract.options],
  })
}
