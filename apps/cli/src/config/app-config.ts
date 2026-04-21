import type * as LogLevel from 'effect/LogLevel'
import type * as Option from 'effect/Option'
import type * as Redacted from 'effect/Redacted'
import { Config, Effect, LogLevel as LogLevelValues } from 'effect'

interface AppConfigShape {
  readonly logLevel: LogLevel.LogLevel
  readonly defaultConcurrency: number
  readonly tracingEndpoint: Option.Option<Redacted.Redacted>
  readonly debug: boolean
}

const DEFAULT_CONCURRENCY = 8

export class AppConfig extends Effect.Service<AppConfig>()('AppConfig', {
  effect: Config.all({
    logLevel: Config.withDefault(LogLevelValues.Debug)(Config.logLevel('LOG_LEVEL')),
    defaultConcurrency: Config.withDefault(DEFAULT_CONCURRENCY)(Config.integer('DEFAULT_CONCURRENCY')),
    tracingEndpoint: Config.option(Config.redacted('OTEL_EXPORTER_OTLP_ENDPOINT')),
    debug: Config.withDefault(false)(Config.boolean('DEBUG')),
  }).pipe(
    Effect.map(config => config satisfies AppConfigShape),
  ),
}) {}
