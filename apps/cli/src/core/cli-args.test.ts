import { Effect, Either } from 'effect'
import { describe, expect, it } from 'vitest'
import { parseCliArgs, parseRawCliArgs } from './cli-args'

describe('parseRawCliArgs', () => {
  it('normalizes aliases and negated booleans for the non-interactive preset flow', () => {
    expect(parseRawCliArgs([
      '--preset',
      'react-app',
      '--name',
      'demo-app',
      '--yes',
      '--no-install',
      '--no-git',
      '--no-rollback',
      '-h',
    ])).toEqual({
      _: [],
      preset: 'react-app',
      name: 'demo-app',
      yes: true,
      install: false,
      git: false,
      help: true,
      rollback: false,
    })
  })
})

describe('parseCliArgs', () => {
  it('surfaces schema contract failures for unsupported preset values', async () => {
    const result = await Effect.runPromise(
      Effect.either(parseCliArgs([
        '--preset',
        'solid-app',
        '--name',
        'demo-app',
      ])),
    )

    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe('SchemaContractError')
      expect(result.left.message).toContain('CliArgs')
      expect(result.left.message).toContain('react-app')
    }
  })
})
