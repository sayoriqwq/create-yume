import type { Layer } from 'effect'
import { ManagedRuntime } from 'effect'

export function makeAppRuntime<R, E>(layer: Layer.Layer<R, E, never>) {
  return ManagedRuntime.make(layer)
}
