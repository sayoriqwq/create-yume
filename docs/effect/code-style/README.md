# Effect Code Style Baseline

This directory records the **official Effect code-style baseline** for this repository.

## Rule of interpretation

- The official Effect documentation is the only baseline.
- These files are local distilled guides for agents, but they must not weaken or override the official guidance.
- If the current code differs from the guidance here, that is a **refactor signal**, not a reason to rewrite the guidance around the current code.

## How to use this directory

- Use `entrypoints.md` for runtime execution boundaries.
- Use `composition.md` for `Effect.gen`, `pipe`, and dual API style choices.
- Use `branching.md` for exhaustive branching and `Match` usage.
- Use `brands.md` for branded-type guidance.
- Use `services.md` for service modeling.
- Use `config.md` for runtime configuration boundaries.
- Use `schema.md` for contract decoding and schema usage.
- Use `scope-and-cleanup.md` for lifecycle and cleanup boundaries.
- Use `testing.md` for Effect-native testing style.
- Use `observability.md` for spans, tracing, and phase-level diagnostics.

## Source posture

These files must track the official docs, not legacy repository conventions.
