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

  return {
    _: parsed._,
    ...(parsed.preset === undefined ? {} : { preset: parsed.preset as RawCliArgs['preset'] }),
    ...(parsed.name === undefined ? {} : { name: parsed.name as RawCliArgs['name'] }),
    ...(parsed.yes === undefined ? {} : { yes: parsed.yes }),
    ...(parsed.install === undefined ? {} : { install: parsed.install }),
    ...(parsed.git === undefined ? {} : { git: parsed.git }),
    ...(parsed.help === undefined ? {} : { help: parsed.help }),
    ...(parsed.version === undefined ? {} : { version: parsed.version }),
    ...(parsed.rollback === undefined ? {} : { rollback: parsed.rollback }),
  }
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
