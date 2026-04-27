# Effect Branching and Exhaustiveness Baseline

Source baseline:

- official Effect guidance on pattern matching
- official Effect control-flow guidance

## Official baseline

- Prefer exhaustive branching for closed unions and known sets of cases.
- Use `Match.exhaustive` when pattern matching improves clarity or safety.
- A `switch` with an explicit `never` check is also acceptable when it is simpler and preserves exhaustiveness.
- Do not rely on runtime defects or supposedly impossible default branches where the compiler can enforce completeness.
- Use ordinary `if` / `switch` for simple local branching; use `Match` when branching is more structural or expressive matching materially improves readability.

## When to apply this

Use this baseline when:

- branching on literal unions
- branching on `_tag`
- extending a closed mode set
- reviewing whether a branch should be compile-time exhaustive

## Divergence rule

If the current code handles closed sets of cases with runtime fallback branches instead of compile-time exhaustiveness, treat that as a refactor signal.
