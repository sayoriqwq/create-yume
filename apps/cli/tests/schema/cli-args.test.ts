import { Effect, Either } from 'effect'
import { describe, expect, it } from 'vitest'
import { decodeCliArgs, formatCliArgsError } from '../../src/schema/cli-args'

describe('cliArgsSchema', () => {
  it('returns a structured decode failure for an invalid preset fixture', async () => {
    const result = await Effect.runPromise(
      Effect.either(
        decodeCliArgs({
          preset: 'solid-app',
          name: 'demo-app',
          yes: true,
        }),
      ),
    )

    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result)) {
      const formatted = formatCliArgsError(result.left)
      expect(formatted).toContain('CliArgs')
      expect(formatted).toContain('preset')
      expect(formatted).toContain('react-app')
    }
  })
})
