import type { StandardCommand } from '@effect/platform/Command'
import * as PlatformCommandExecutor from '@effect/platform/CommandExecutor'
import { Effect, Layer } from 'effect'
import { describe, expect, it } from 'vitest'
import { makeCommandName } from '@/brand/command-name'
import { CommandError } from '@/core/errors'
import { CommandService } from './command'

function makeCommandExecutorLayer(
  string: PlatformCommandExecutor.CommandExecutor['string'],
) {
  return Layer.succeed(
    PlatformCommandExecutor.CommandExecutor,
    {
      [PlatformCommandExecutor.TypeId]: PlatformCommandExecutor.TypeId,
      exitCode: () => Effect.succeed(0 as PlatformCommandExecutor.ExitCode),
      start: () => undefined as never,
      string,
      lines: () => Effect.succeed([]),
      stream: () => undefined as never,
      streamLines: () => undefined as never,
    } satisfies PlatformCommandExecutor.CommandExecutor,
  )
}

describe('command service', () => {
  it('executes commands without leaking CommandExecutor to callers', async () => {
    const executed: Array<{ command: string, args: string[] }> = []

    const executorLayer = makeCommandExecutorLayer(
      (command: StandardCommand) =>
        Effect.sync(() => {
          executed.push({
            command: command.command,
            args: [...command.args],
          })
          return 'mocked stdout'
        }),
    )
    const commandLayer = CommandService.Default.pipe(Layer.provide(executorLayer))

    const output = await Effect.runPromise(
      Effect.gen(function* () {
        const commands = yield* CommandService
        const command = commands.make(makeCommandName('pnpm'), 'install')
        return yield* commands.execute(command)
      }).pipe(
        Effect.provide(commandLayer),
      ),
    )

    expect(output).toBe('mocked stdout')
    expect(executed).toEqual([
      {
        command: 'pnpm',
        args: ['install'],
      },
    ])
  })

  it('maps platform command failures into CommandError', async () => {
    const executorLayer = makeCommandExecutorLayer(
      () =>
        Effect.fail({
          _tag: 'SystemError',
          reason: 'PermissionDenied',
          module: 'Command',
          method: 'start',
          pathOrDescriptor: '/tmp/forbidden',
          message: 'forced failure',
        }),
    )
    const commandLayer = CommandService.Default.pipe(Layer.provide(executorLayer))

    const result = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const commands = yield* CommandService
        const command = commands.make(makeCommandName('git'), 'status')
        return yield* commands.execute(command)
      }).pipe(
        Effect.provide(commandLayer),
      ),
    )

    expect(result._tag).toBe('Failure')
    if (result._tag === 'Failure') {
      const failure = result.cause._tag === 'Fail' ? result.cause.error : undefined
      expect(failure).toBeInstanceOf(CommandError)
      expect(failure).toMatchObject({
        command: 'git',
        args: ['status'],
      })
    }
  })
})
