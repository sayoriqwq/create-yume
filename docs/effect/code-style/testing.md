# Effect Testing Baseline

Source baseline:

- official Effect testing guidance, especially around `TestClock`
- official Effect style of testing through effect-native seams rather than ambient mutation

## Official baseline

- Prefer Effect-native testing seams over global mutation.
- Use deterministic time control such as `TestClock` for time-sensitive behavior instead of sleeping in real time.
- Test boundary contracts at the place where they are decoded or provided.
- Prefer explicit mock or provided dependencies over hidden ambient behavior.

## When to apply this

Use this baseline when:

- testing time-sensitive Effects
- testing config-driven behavior
- testing service-dependent logic
- reviewing slow or flaky tests that rely on real time or ambient globals

## Divergence rule

If the current tests rely on real sleeps, ambient process mutation, or hidden dependency coupling where Effect-native testing seams would make them deterministic, treat that as a refactor signal.
