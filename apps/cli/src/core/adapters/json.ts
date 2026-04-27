import { Effect, pipe, Schema } from 'effect'
import { FileIOError } from '@/core/errors'

export function safeParseJson(input: string, path: string) {
  return pipe(
    Schema.decodeUnknown(Schema.parseJson())(input),
    Effect.flatMap((decoded) => {
      if (typeof decoded === 'object' && decoded !== null && !Array.isArray(decoded)) {
        return Effect.succeed(decoded as Record<string, unknown>)
      }

      return Effect.fail(new FileIOError({
        op: 'parse',
        path,
        message: 'Failed to parse JSON: Expected a JSON object',
      }))
    }),
    Effect.mapError(e =>
      e instanceof FileIOError
        ? e
        : new FileIOError({
            op: 'parse',
            path,
            message: `Failed to parse JSON: ${e}`,
          }),
    ),
  )
}
