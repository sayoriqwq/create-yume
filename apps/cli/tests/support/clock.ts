import type { DurationInput } from 'effect/Duration'
import { Effect, TestClock, TestContext } from 'effect'

export function withTestClock<A, E, R>(effect: Effect.Effect<A, E, R>) {
  return effect.pipe(Effect.provide(TestContext.TestContext))
}

export function adjustTestClock(duration: DurationInput) {
  return TestClock.adjust(duration)
}
