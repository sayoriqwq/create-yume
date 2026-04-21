# Effect Testing Convention

## Goal

Tests should use Effect-native seams for runtime configuration, time, fixtures, and service mocks.

## Directory Layout

- `apps/cli/tests/support/fixtures.ts` contains reusable `ProjectConfig` fixtures.
- `apps/cli/tests/support/config-provider.ts` wraps `ConfigProvider.fromMap`.
- `apps/cli/tests/support/clock.ts` wraps `TestClock` and `TestContext`.
- `apps/cli/tests/support/mock-layers.ts` contains test-only service layers.
- `apps/cli/tests/support/make-app-runtime.ts` exposes a small `ManagedRuntime` factory.

## Rules

- Prefer shared fixtures over ad hoc project config objects in tests.
- Prefer `ConfigProvider.fromMap` over `process.env` mutation in tests.
- Use `TestClock` for time-sensitive effects; do not sleep in real time.
- Keep mock layers in `apps/cli/tests/support/`, not in production `src/`.
