import type { CodeQuality } from '@/schema/project-config'
import { multiselect } from '@clack/prompts'
import { workspaceBootstrapQuestionContracts } from '@/core/workspace-bootstrap'

export async function askCodeQuality() {
  return await multiselect<CodeQuality>({
    message: workspaceBootstrapQuestionContracts.codeQuality.message,
    required: workspaceBootstrapQuestionContracts.codeQuality.required,
    options: [...workspaceBootstrapQuestionContracts.codeQuality.options],
  })
}
