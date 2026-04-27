# Effect Brand Baseline

Source baseline:

- official Effect branded-types guidance

## Official baseline

- Use branded types when multiple values share the same primitive representation but must not be interchangeable.
- Introduce brands at boundaries where domain meaning matters and accidental mixing would be harmful.
- Decode or construct branded values at the boundary instead of scattering unchecked casts through business logic.
- Once a concept is branded, prefer preserving the brand across that boundary rather than collapsing back to a raw primitive.

## When to apply this

Use this baseline when:

- a string, number, or path value carries distinct domain meaning
- two primitive-shaped values should not be mixed
- reviewing whether an unchecked cast is hiding a missing boundary type

## Divergence rule

If the current code relies on raw primitives where branded boundaries would prevent real category mistakes, treat that as a refactor signal.
