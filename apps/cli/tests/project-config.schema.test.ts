import { Effect, Exit } from 'effect'
import { describe, expect, it } from 'vitest'
import { decodeProjectConfig, decodeSharedFrontendAppConfig } from '../src/schema/project-config'
import { reactProjectConfig, vueProjectConfig } from './support/fixtures'

describe('project config schema contract', () => {
  it('decodes a react fixture', async () => {
    const decoded = await Effect.runPromise(decodeProjectConfig(reactProjectConfig))

    expect(decoded).toEqual(reactProjectConfig)
  })

  it('decodes a vue fixture', async () => {
    const decoded = await Effect.runPromise(decodeProjectConfig(vueProjectConfig))

    expect(decoded).toEqual(vueProjectConfig)
  })

  it('rejects unsupported project types', async () => {
    const exit = await Effect.runPromiseExit(
      decodeProjectConfig({
        ...reactProjectConfig,
        type: 'node',
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it('keeps framework-specific router and state fields out of shared frontend config', async () => {
    const sharedConfig = await Effect.runPromise(decodeSharedFrontendAppConfig({
      name: reactProjectConfig.name,
      type: reactProjectConfig.type,
      language: reactProjectConfig.language,
      git: reactProjectConfig.git,
      linting: reactProjectConfig.linting,
      codeQuality: reactProjectConfig.codeQuality,
      buildTool: reactProjectConfig.buildTool,
      cssPreprocessor: reactProjectConfig.cssPreprocessor,
      cssFramework: reactProjectConfig.cssFramework,
    }))

    expect(sharedConfig).toEqual({
      name: reactProjectConfig.name,
      type: reactProjectConfig.type,
      language: reactProjectConfig.language,
      git: reactProjectConfig.git,
      linting: reactProjectConfig.linting,
      codeQuality: reactProjectConfig.codeQuality,
      buildTool: reactProjectConfig.buildTool,
      cssPreprocessor: reactProjectConfig.cssPreprocessor,
      cssFramework: reactProjectConfig.cssFramework,
    })

    const projected = await Effect.runPromise(
      decodeSharedFrontendAppConfig(reactProjectConfig),
    )

    expect(projected).toEqual(sharedConfig)
  })

  it('rejects cross-framework router and state semantics', async () => {
    const reactExit = await Effect.runPromiseExit(
      decodeProjectConfig({
        ...reactProjectConfig,
        router: true,
        stateManagement: true,
      }),
    )
    const vueExit = await Effect.runPromiseExit(
      decodeProjectConfig({
        ...vueProjectConfig,
        router: 'react-router',
        stateManagement: 'jotai',
      }),
    )

    expect(Exit.isFailure(reactExit)).toBe(true)
    expect(Exit.isFailure(vueExit)).toBe(true)
  })
})
