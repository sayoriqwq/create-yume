# Effect Reference Corpus

This directory contains the project-local Effect documentation corpus used for day-to-day reference work.

## Default usage rule

Use the local files in `docs/effect/` first.

This is the default because Effect is a core dependency of this repository, and the local corpus makes repeated lookups cheaper and more stable during implementation and review work.

## When to use each file

- `llms.txt`
  - Use when you need the documentation index or need to find which topic file to read.
  - Treat it as the table of contents for the corpus.

- `llms-small.txt`
  - Use when context is tight and you only need a compressed reference.
  - Good for quick orientation, lightweight checks, and smaller-context workflows.

- `llms-full.txt`
  - Use when you need complete detail, examples, or higher-confidence interpretation.
  - Prefer this for deeper architectural or API questions.

## When to fetch the official docs instead

Fetch from `https://effect.website` when:

- the local corpus may be stale
- you need to verify the latest API or wording
- the local corpus does not contain the topic you need
- the question is explicitly freshness-sensitive

Official endpoints:

- `https://effect.website/llms.txt`
- `https://effect.website/llms-small.txt`
- `https://effect.website/llms-full.txt`

## Local companion guides

For short repository-local guidance distilled from the official docs, see:

- `docs/effect/code-style/README.md`
- `docs/effect/code-style/entrypoints.md`
- `docs/effect/code-style/composition.md`
- `docs/effect/code-style/branching.md`
- `docs/effect/code-style/brands.md`
- `docs/effect/code-style/services.md`
- `docs/effect/code-style/config.md`
- `docs/effect/code-style/schema.md`
- `docs/effect/code-style/scope-and-cleanup.md`
- `docs/effect/code-style/testing.md`
- `docs/effect/code-style/observability.md`

## Practical policy

- Default: local first
- Freshness check or missing content: fetch official docs
- Do not duplicate this guidance elsewhere unless the policy changes
