import { ConfigProvider, Effect, Option, Redacted } from 'effect'
import { describe, expect, it } from 'vitest'
import { AppConfig } from '../../src/config/app-config'

describe('appConfig', () => {
  it('reads runtime settings from ConfigProvider.fromMap', async () => {
    const provider = ConfigProvider.fromMap(new Map([
      ['LOG_LEVEL', 'Info'],
      ['DEFAULT_CONCURRENCY', '4'],
      ['OTEL_EXPORTER_OTLP_ENDPOINT', 'https://collector.example'],
      ['DEBUG', 'true'],
    ]))

    const config = await Effect.runPromise(
      AppConfig.pipe(
        Effect.provide(AppConfig.Default),
        Effect.withConfigProvider(provider),
      ),
    )

    expect(config.logLevel._tag).toBe('Info')
    expect(config.defaultConcurrency).toBe(4)
    expect(config.debug).toBe(true)
    expect(Option.isSome(config.tracingEndpoint)).toBe(true)

    if (Option.isNone(config.tracingEndpoint)) {
      throw new Error('expected tracing endpoint to be present')
    }

    expect(Redacted.value(config.tracingEndpoint.value)).toBe('https://collector.example')
  })

  it('falls back to defaults when config values are missing', async () => {
    const config = await Effect.runPromise(
      AppConfig.pipe(
        Effect.provide(AppConfig.Default),
        Effect.withConfigProvider(ConfigProvider.fromMap(new Map())),
      ),
    )

    expect(config.logLevel._tag).toBe('Debug')
    expect(config.defaultConcurrency).toBe(8)
    expect(config.debug).toBe(false)
    expect(Option.isNone(config.tracingEndpoint)).toBe(true)
  })
})
