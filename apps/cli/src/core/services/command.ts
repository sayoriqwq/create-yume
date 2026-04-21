import type { StandardCommand } from '@effect/platform/Command'
import type { CommandExecutor } from '@effect/platform/CommandExecutor'
import type { CommandName } from '@/brand/command-name'
// 借助平台能力，但转化为领域错误
import { Command } from '@effect/platform'
import { Context, Effect, Layer } from 'effect'
import { CommandError } from '@/types/error'

interface CommandService {
  readonly make: (cmd: CommandName, ...args: string[]) => StandardCommand
  // 依赖于 CommandExecutor 来执行
  readonly execute: (command: StandardCommand) => Effect.Effect<string, CommandError, CommandExecutor>
}

class CommandServiceTag extends Context.Tag('Command')<CommandServiceTag, CommandService>() {}

export const CommandLive = Layer.effect(
  CommandServiceTag,
  Effect.gen(function* () {
    const make: CommandService['make'] = (cmd, ...args) => {
      const command = Command.make(cmd, ...args)
      // 只有使用 Command.pipeTo 或者 command.pipe 才会导致类型发生变动，暂时没有这种需求
      return command as StandardCommand
    }

    const execute: CommandService['execute'] = (command) => {
      // 必须把日志与命令执行组合进同一个 Effect，单独调用 Effect.logInfo 不会执行
      return Effect.gen(function* () {
        yield* Effect.logInfo(`Executing command: ${command.command} ${command.args.join(' ')}`)

        const output = yield* Command
          .string(command)
          .pipe(Effect.mapError(() => new CommandError({
            command: command.command,
            args: [...command.args],
          })))

        // 只有在真正得到结果后再输出
        yield* Effect.logDebug(`Command output: ${output}`)
        return output
      })
    }

    return CommandServiceTag.of({ make, execute })
  }),
)

export { CommandServiceTag as CommandService }
