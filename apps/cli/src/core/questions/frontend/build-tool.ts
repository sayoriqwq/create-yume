import type { BuildTool } from '@/schema/project-config'
import { select } from '@clack/prompts'
import { sharedFrontendQuestionContracts } from '@/core/template-registry/frontend-app'

export async function askBuildTool() {
  const contract = sharedFrontendQuestionContracts.buildTool
  return await select<BuildTool>({
    message: contract.message,
    options: [...contract.options],
  })
}
