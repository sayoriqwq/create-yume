import { readFileSync } from 'node:fs'
import { Effect, Layer } from 'effect'
import { describe, expect, it } from 'vitest'
import { makeProjectName } from '@/brand/project-name'
import { getSharedFrontendPresetDefaults } from '@/core/template-registry/frontend-app'
import { getWorkspaceBootstrapPresetDefaults } from '@/core/workspace-bootstrap'
import { CliContextLive } from '../../../src/core/cli-context'
import { collectQuestions } from '../../../src/core/questions/compose'
import { makeFsMockLayer } from '../../support/mock-layers'

describe('collectQuestions', () => {
  it('keeps closed union exhaustiveness out of the Effect defect channel', () => {
    const source = readFileSync(new URL('../../../src/core/questions/compose.ts', import.meta.url), 'utf8')

    expect(source).toContain('function assertNever(value: never): never')
    expect(source).not.toContain('Effect.dieMessage')
  })

  it('builds a preset project config from CliContext without invoking interactive prompts', async () => {
    const projectName = makeProjectName('non-interactive-react')
    const sharedFrontendDefaults = getSharedFrontendPresetDefaults('react-app')
    const workspaceBootstrapDefaults = getWorkspaceBootstrapPresetDefaults(false)

    const projectConfig = await Effect.runPromise(
      collectQuestions.pipe(
        Effect.provide(
          Layer.mergeAll(
            CliContextLive({
              args: {
                preset: 'react-app',
                name: projectName,
                git: false,
                install: true,
              },
              isInteractive: false,
            }),
            makeFsMockLayer({
              exists: () => Effect.succeed(false),
            }),
          ),
        ),
      ),
    )

    expect(projectConfig).toEqual({
      name: projectName,
      type: 'react',
      language: 'typescript',
      git: false,
      ...workspaceBootstrapDefaults,
      ...sharedFrontendDefaults,
      router: 'react-router',
      stateManagement: 'jotai',
    })
  })
})
