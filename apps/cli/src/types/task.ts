import type { StandardCommand } from '@effect/platform/Command'
import type { ContributionTrace } from '@/core/ownership/model'
import type { PostGenerateCommandPhaseSpec } from '@/schema/plan-spec'

export type GenerateTask = RenderTask | CopyTask
export type ModifyTask = JsonTask | TextTask
export type Task = GenerateTask | ModifyTask

interface ITask {
  kind: 'render' | 'copy' | 'json' | 'text'
  path: string
  ownership?: ContributionTrace
}

export interface RenderTask extends ITask {
  kind: 'render'
  src: string
  data?: unknown
}
export interface CopyTask extends ITask {
  kind: 'copy'
  src: string
}

export interface JsonTask extends ITask {
  kind: 'json'
  readExisting?: boolean
  sortKeys?: boolean
  reducers: Array<(draft: Record<string, unknown>) => void>
  base?: () => Record<string, unknown>
  finalize?: (draft: Record<string, unknown>) => void
}

export interface TextTask extends ITask {
  kind: 'text'
  readExisting?: boolean
  transforms: Array<(current: string) => string>
  base?: () => string
}

export interface PostGenerateCommand {
  readonly command: StandardCommand
  readonly phase: PostGenerateCommandPhaseSpec
  readonly ownership: ContributionTrace
}

export interface Plan {
  tasks: Task[]
  postGenerateCommands?: PostGenerateCommand[]
}
