import { Effect, Exit } from 'effect'
import { describe, expect, it } from 'vitest'
import { decodeProjectConfig } from '../src/schema/project-config'
import { reactProjectConfig } from './support/fixtures'

describe('project config schema contract', () => {
  it('decodes a shared react fixture', async () => {
    const decoded = await Effect.runPromise(decodeProjectConfig(reactProjectConfig))

    expect(decoded).toEqual(reactProjectConfig)
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
})
