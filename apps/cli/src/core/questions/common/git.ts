import { confirm } from '@clack/prompts'
import { workspaceBootstrapQuestionContracts } from '@/core/workspace-bootstrap'

export async function askGit() {
  return await confirm({
    message: workspaceBootstrapQuestionContracts.git.message,
    initialValue: workspaceBootstrapQuestionContracts.git.initialValue,
  })
}
