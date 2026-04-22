import type { CSSPreprocessor } from '@/types/project'
import { select } from '@clack/prompts'
import { sharedFrontendQuestionContracts } from '@/core/template-registry/frontend-app'

export async function askCSSPreprocessor() {
  const contract = sharedFrontendQuestionContracts.cssPreprocessor
  return await select<CSSPreprocessor>({
    message: contract.message,
    options: [...contract.options],
  })
}
