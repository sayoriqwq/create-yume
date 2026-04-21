import { Effect, Layer } from 'effect'
import { describe, expect, it } from 'vitest'
import { makeProjectName } from '@/brand/project-name'
import { makeFsMockLayer } from '../../../tests/support/mock-layers'
import { CliContextLive } from '../cli-context'
import { collectQuestions } from './compose'

describe('collectQuestions', () => {
  it('builds a preset project config from CliContext without invoking interactive prompts', async () => {
    const projectName = makeProjectName('non-interactive-react')

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
      linting: 'antfu-eslint',
      codeQuality: [],
      buildTool: 'vite',
      router: 'react-router',
      stateManagement: 'jotai',
      cssPreprocessor: 'less',
      cssFramework: 'tailwind',
    })
  })
})
