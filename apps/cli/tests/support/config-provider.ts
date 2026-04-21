import { ConfigProvider } from 'effect'

export interface TestConfigValues {
  readonly LOG_LEVEL?: string
  readonly DEFAULT_CONCURRENCY?: string
  readonly OTEL_EXPORTER_OTLP_ENDPOINT?: string
  readonly DEBUG?: string
}

export function makeTestConfigProvider(values: TestConfigValues = {}) {
  return ConfigProvider.fromMap(new Map(Object.entries(values)))
}
