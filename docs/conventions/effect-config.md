# Effect Config Convention

## Goal

All runtime configuration enters the CLI through `AppConfig`.

## Rules

- Read runtime config only in [`apps/cli/src/config/app-config.ts`](/Users/sayori/Desktop/create-yume/apps/cli/src/config/app-config.ts).
- Prefer `Config.*` combinators over direct `process.env` access.
- Sensitive values must use `Config.redacted`.
- Consumers receive parsed values from `AppConfig`; they do not re-parse raw strings downstream.

## Current Keys

- `LOG_LEVEL`
- `DEFAULT_CONCURRENCY`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `DEBUG`

## Testing

- Use `ConfigProvider.fromMap` with `Effect.withConfigProvider(...)`.
- Test config behavior at the boundary; do not mock raw environment access in business code.
