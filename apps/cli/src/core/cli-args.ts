import { Effect, ParseResult } from 'effect'
import mri from 'mri'
import { decodeCliArgs, formatCliArgsError } from '@/schema/cli-args'
import { SchemaContractError } from '@/types/error'

export interface RawCliArgs {
  readonly _: string[]
  readonly preset?: string | string[]
  readonly name?: string | string[]
  readonly yes?: boolean
  readonly install?: boolean
  readonly git?: boolean
  readonly help?: boolean
  readonly version?: boolean
  readonly rollback?: boolean
}

type MutableRawCliArgs = {
  -readonly [Key in keyof RawCliArgs]: RawCliArgs[Key]
}

export function parseRawCliArgs(argv: string[]): RawCliArgs {
  const parsed = mri(argv, {
    alias: {
      h: 'help',
      v: 'version',
    },
    boolean: ['yes', 'install', 'git', 'help', 'version', 'rollback'],
    default: {
      rollback: true,
    },
  })

  const rawArgs: MutableRawCliArgs = { _: parsed._ }

  if (parsed.preset !== undefined)
    rawArgs.preset = parsed.preset
  if (parsed.name !== undefined)
    rawArgs.name = parsed.name
  if (parsed.yes !== undefined)
    rawArgs.yes = parsed.yes
  if (parsed.install !== undefined)
    rawArgs.install = parsed.install
  if (parsed.git !== undefined)
    rawArgs.git = parsed.git
  if (parsed.help !== undefined)
    rawArgs.help = parsed.help
  if (parsed.version !== undefined)
    rawArgs.version = parsed.version
  if (parsed.rollback !== undefined)
    rawArgs.rollback = parsed.rollback

  return rawArgs
}

export function parseCliArgs(argv: string[]) {
  return decodeCliArgs(parseRawCliArgs(argv)).pipe(
    Effect.mapError(error => new SchemaContractError({
      schema: 'CliArgs',
      message: formatCliArgsError(error),
      issueCount: ParseResult.ArrayFormatter.formatErrorSync(error).length,
    })),
  )
}
