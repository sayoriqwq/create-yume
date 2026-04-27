import type { Linting } from '@/schema/project-config'
import { select } from '@clack/prompts'
import { workspaceBootstrapQuestionContracts } from '@/core/workspace-bootstrap'

export async function askLinting() {
  return await select<Linting>({
    message: workspaceBootstrapQuestionContracts.linting.message,
    options: [...workspaceBootstrapQuestionContracts.linting.options],
  })
}
