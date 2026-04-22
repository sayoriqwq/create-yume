# Architecture Review - Software Design Philosophy

## Summary

This review re-examines the CLI architecture through the lens of John
Ousterhout's design philosophy: reduce complexity, prefer deep modules, hide
design decisions, and avoid temporal decomposition.

The current architecture is not chaotic. The main pipeline is coherent and
test-backed: CLI entry collects configuration, orchestrates project generation,
applies a plan, and runs post-generation commands. That structure is visible in
`docs/overview.md:23-36`, `apps/cli/src/index.ts:110-125`, and
`apps/cli/tests/generated-projects.smoke.ts:30-90`.

However, the architecture is currently organized more by execution stages than
by hidden design decisions. As a result, several important decisions such as
router selection, state management, code quality setup, template layout, and
bootstrap behavior are reflected across multiple modules instead of being owned
by one deep abstraction. This creates change amplification, cognitive load, and
unknown-unknowns, which are the core complexity symptoms in Ousterhout's model.

## Complexity Symptoms

### 1. Change Amplification

A single feature decision often requires coordinated changes in multiple files:

- schema and type model:
  `apps/cli/src/schema/project-config.ts:54-60,72-80,92-106`
- question flow:
  `apps/cli/src/core/questions/compose.ts:69-87,99-126`
- template registry:
  `apps/cli/src/core/template-registry/react.ts:6-48`
  `apps/cli/src/core/template-registry/vue.ts:6-48`
- `package.json` composition:
  `apps/cli/src/core/modifier/package-json.ts:23-66`
- post-generate command setup:
  `apps/cli/src/core/commands/index.ts:10-58`

This is clearest for `router`, `stateManagement`, and `codeQuality`. The same
decision appears in questions, schema, package mutation, file generation, and
bootstrap commands. That is textbook information leakage.

### 2. Cognitive Load

Several modules only make sense once the reader already knows repository
conventions that are not encoded in one authoritative abstraction:

- the entry imports three different `compose` modules with different roles:
  `apps/cli/src/index.ts:15-18`
- template partial registration depends on implicit directory naming and
  namespace rules:
  `apps/cli/src/core/services/orchestrator.ts:35-46`
  `apps/cli/src/core/services/template-engine.ts:17-19,54-78`
- the type surface is split between `types/config.ts` and `types/project.ts`:
  `apps/cli/src/types/config.ts:1-21`
  `apps/cli/src/types/project.ts:1-10`

None of these are catastrophic defects, but they increase the amount of local
knowledge needed to make safe changes.

### 3. Unknown Unknowns

The planner has a strong serialization boundary through `PlanSpec`, but plan
execution still relies on an implicit invariant: no dangerous overlaps exist
between tasks that target the same output path.

- build-time plan creation is flat:
  `apps/cli/src/core/services/planner.ts:161-253`
- apply-time execution groups only by task kind:
  `apps/cli/src/core/services/planner.ts:471-496`

Today this works because composition is disciplined, for example
`package.json` is currently owned by one builder in
`apps/cli/src/core/modifier/package-json.ts:23-24`. But the architecture does
not yet make path ownership explicit, so future extensions can create hidden
interactions without tripping a design guardrail.

## Deep Modules Worth Preserving

The review does not support a rewrite. Several existing modules already follow
good design philosophy and should be preserved.

### `FsService` is a deep module

`FsService` hides platform-specific file APIs and normalizes failures into a
single repo-local error boundary.

- public surface:
  `apps/cli/src/core/services/fs.ts:6-23`
- implementation:
  `apps/cli/src/core/services/fs.ts:25-105`

This is a good example of pulling complexity downward: callers do not need to
understand platform file service details or error mapping rules.

### `TemplateEngineService` is directionally strong

The template engine centralizes Handlebars runtime creation, safety defaults,
helper registration, partial registration, and rendering.

- runtime safety and config injection:
  `apps/cli/src/core/services/template-engine.ts:38-47`
- helper/partial registration:
  `apps/cli/src/core/services/template-engine.ts:49-78`
- compile/render boundary:
  `apps/cli/src/core/services/template-engine.ts:80-104`

This is the right place for template-runtime complexity. The weakness is not
its existence, but that callers still need to know too much about partial
directory structure.

### `PlanSpec` is a valuable abstraction boundary

The repository already separates executable plans from stable serialized plan
descriptions:

- plan-to-spec projection:
  `apps/cli/src/core/services/planner.ts:84-139`
- serializable schema:
  `apps/cli/src/schema/plan-spec.ts:26-104`
- snapshot coverage:
  `apps/cli/tests/planner.spec.ts:33-56`

That is good strategic design. It lowers testing complexity without forcing the
runtime plan representation itself to become serialization-shaped.

### Rollback semantics are well-designed

Failure cleanup is modeled using tracked paths and scoped finalizers rather than
ad hoc mutable cleanup state.

- cleanup and finalizer registration:
  `apps/cli/src/core/services/planner.ts:327-378`
- rollback test coverage:
  `apps/cli/tests/planner-rollback.test.ts:12-160`

This is a strong example of "define errors out of existence" by making cleanup
operations idempotent and centralized.

## Design Red Flags

### 1. Information Leakage

The same design decisions appear in too many places.

#### Router and state management

- schema model:
  `apps/cli/src/schema/project-config.ts:54-60,72-80,92-106`
- questions:
  `apps/cli/src/core/questions/compose.ts:103-126`
- template generation:
  `apps/cli/src/core/template-registry/react.ts:14-47`
  `apps/cli/src/core/template-registry/vue.ts:26-48`
- package composition:
  `apps/cli/src/core/modifier/package-json.ts:45-63`
- template behavior expectations:
  `apps/cli/src/core/services/template-helpers.test.ts:18-50`

That means the architecture does not currently hide "what router means" or
"what state management means" behind a single owner.

#### Code quality and git bootstrap

- question logic:
  `apps/cli/src/core/questions/compose.ts:73-79`
- `package.json` dependency and script logic:
  `apps/cli/src/core/modifier/package-json.ts:29-33`
- hook creation commands:
  `apps/cli/src/core/commands/index.ts:21-52`
- command expectations in tests:
  `apps/cli/src/core/commands/index.test.ts:10-36`

The result is a cross-phase knowledge chain. A new code-quality option would
not be localized to one module.

### 2. Temporal Decomposition

The top-level decomposition follows execution order:

1. collect questions
2. generate project
3. finish project

That order is visible in `apps/cli/src/index.ts:117-120`. The problem is not
the pipeline itself; the problem is that architectural ownership is also shaped
around that pipeline.

For example:

- `generateProject` is a thin orchestration wrapper:
  `apps/cli/src/core/services/compose.ts:49-61`
- `finishProject` is a thin wrapper around command construction and execution:
  `apps/cli/src/core/services/compose.ts:84-94`
- `buildTemplates` is mostly a registry forwarding function:
  `apps/cli/src/core/services/compose.ts:22-36`

These modules are not useless, but they are relatively shallow. They sequence
work more than they encapsulate design knowledge.

### 3. Pass-Through Layering

Some adjacent layers do not provide sufficiently different abstractions:

- `buildTemplates(...)` forwards registry entries into DSL render tasks with
  little additional policy:
  `apps/cli/src/core/services/compose.ts:22-36`
- orchestrator manually wires helpers, partials, root asset setup,
  `package.json`, and registry templates:
  `apps/cli/src/core/services/orchestrator.ts:40-64`

This means the orchestrator knows about multiple implementation details at
once:

- template root layout
- partial namespace convention
- root asset copy policy
- `package.json` mutation ownership
- registry rendering

That is too much knowledge for one coordinating module.

### 4. Shared Model Contaminated By Special Cases

`BaseFrontendAppConfig` claims to be shared, but includes fields whose meaning
differs substantially by framework:

- `router` is a union of React router strings and Vue booleans:
  `apps/cli/src/schema/project-config.ts:54-60`
- the shared base includes those fields:
  `apps/cli/src/schema/project-config.ts:72-80`
- framework-specific schemas narrow them back down:
  `apps/cli/src/schema/project-config.ts:92-106`

This is a sign that the shared abstraction is not actually general-purpose.
The common layer is carrying framework-specific meaning instead of exposing a
smaller shared interface.

### 5. Obscurity Through Naming And Export Shape

The repository contains multiple similarly named modules whose responsibilities
are only obvious after reading them:

- `apps/cli/src/core/compose.ts`
- `apps/cli/src/core/questions/compose.ts`
- `apps/cli/src/core/services/compose.ts`

The entry point imports all three roles together:
`apps/cli/src/index.ts:15-18`.

There is also a split type surface:

- `apps/cli/src/types/config.ts:1-21`
- `apps/cli/src/types/project.ts:1-10`

These are manageable today, but they contribute to obscurity, one of the two
root causes of complexity in the design philosophy framework.

## Root Cause

The architecture is primarily stage-oriented rather than decision-oriented.

It is decomposed around:

- input collection
- orchestration
- template generation
- package mutation
- command execution

instead of around hidden design decisions such as:

- framework ownership
- routing capability
- state capability
- styling capability
- git/code-quality bootstrap policy
- target path ownership

Because of that split, important knowledge is scattered across schema,
questions, registry, modifier, command, and orchestrator modules. The system
still works, but complexity is being distributed sideways instead of absorbed
downward.

## Recommendations

### 1. Re-cut the architecture around decision ownership

The highest-leverage change is to move from stage-oriented assembly toward
decision-oriented contribution.

Recommended shape:

- a framework owner per scaffold family:
  React and Vue
- feature contributors under each framework or in shared space:
  router, state, styling, language, git-quality, assets

Each contributor should own all consequences of its decision:

- question fragments if needed
- template fragments and partials
- JSON/text mutations
- static assets
- post-generate actions

That would replace today's knowledge scattering across:

- `apps/cli/src/core/questions/compose.ts`
- `apps/cli/src/core/template-registry/*.ts`
- `apps/cli/src/core/modifier/package-json.ts`
- `apps/cli/src/core/commands/index.ts`
- `apps/cli/src/core/services/orchestrator.ts`

### 2. Keep the shared model truly shared

`BaseFrontendAppConfig` should only contain fields with consistent semantics
across frameworks.

Likely shared:

- `name`
- `language`
- `git`
- `linting`
- `codeQuality`
- `buildTool`
- `cssPreprocessor`
- `cssFramework`

Likely framework-specific:

- `router`
- `stateManagement`

If shared templates only need coarse capabilities such as "has router", derive
those explicitly rather than leaking raw framework-specific values into the
base config surface.

Evidence:

- `apps/cli/src/schema/project-config.ts:72-80`
- `apps/cli/src/schema/project-config.ts:92-106`
- `apps/cli/src/core/template-registry/frontend-app.ts:5-80`

### 3. Turn template environment setup into a deeper module

The template layer should hide partial discovery and namespace rules, rather
than requiring orchestrator to manually assemble them.

Current leakage:

- template root resolution:
  `apps/cli/src/core/services/orchestrator.ts:33-36`
- partial registration loop:
  `apps/cli/src/core/services/orchestrator.ts:43-47`
- external partial API:
  `apps/cli/src/core/services/template-engine.ts:17-19,54-78`

Better direction:

- a template catalog or template environment module should expose
  "prepare template runtime for this config"
- orchestrator should not need to know directory names such as
  `partials/react`, `partials/vue`, and `partials/global`

### 4. Make path ownership explicit in the planner

The planner should protect the invariant that output path ownership is known and
safe.

Current state:

- tasks are collected flat:
  `apps/cli/src/core/services/planner.ts:161-253`
- execution is grouped by task kind only:
  `apps/cli/src/core/services/planner.ts:471-496`

Recommended minimum upgrade:

- detect duplicate target paths during plan build or before apply
- serialize mutations that touch the same path
- keep concurrency only across independent paths

This preserves the current throughput benefits while reducing hidden coupling.

### 5. Raise the command layer to semantic actions

`buildCommands` currently exposes shell-shaped implementation details:

- `apps/cli/src/core/commands/index.ts:22-56`
- `apps/cli/src/core/commands/index.test.ts:29-35`

That is acceptable for a small system, but shallow from a design perspective.
Callers and tests currently know too much about how git/husky/commit hooks are
implemented.

Better direction:

- introduce semantic bootstrap actions such as:
  `initGit`, `installDependencies`, `setupCommitHooks`
- let one deeper module translate those actions into platform commands

### 6. Reduce obscurity in naming and exports

This is lower priority than the architectural cuts above, but still worth
doing during the refactor:

- rename the various `compose.ts` files to role-specific names
- unify the type export surface so there is one obvious import home for project
  configuration types

Evidence:

- `apps/cli/src/index.ts:15-18`
- `apps/cli/src/types/config.ts:1-21`
- `apps/cli/src/types/project.ts:1-10`

## Trade-offs

| Option | Pros | Cons |
| --- | --- | --- |
| Keep the current stage-oriented architecture and patch locally | Lowest short-term cost; easiest to continue shipping React/Vue improvements | Information leakage, change amplification, and obscurity continue to accumulate |
| Move to fully vertical per-framework ownership | Easy to understand ownership boundaries within React and Vue | Risks duplication for shared features such as git/code quality, language, and styling |
| Move to framework owners plus feature contributors | Best fit for current repo shape; localizes decisions while preserving reuse | Requires an explicit redesign pass and migration sequencing |

## Consensus Addendum

- **Antithesis (steelman):** The current CLI only supports two scaffold
  families. A larger architectural refactor could introduce abstraction cost
  before the product surface is large enough to justify it.
- **Tradeoff tension:** Staying tactical preserves velocity today, but every new
  feature option is likely to keep spreading the same decision across schema,
  questions, templates, package composition, and command setup.
- **Synthesis (if viable):** Do not introduce a plugin system or a generalized
  remote-template architecture. Instead, perform one strategic refactor that
  reassigns ownership of existing decisions, preserves the good deep modules,
  and strengthens path ownership and template/runtime boundaries.

## Suggested Refactor Sequence

1. Define the target module map on paper first.
   Capture framework owners, feature contributors, and path ownership rules
   before moving files.
2. Narrow the config model.
   Separate truly shared config from framework-specific capability choices.
3. Re-home one decision end to end.
   For example, move router ownership so one module owns questions, templates,
   package mutations, and related actions.
4. Introduce planner path-ownership checks.
   Add structural protection before the contributor count grows.
5. Collapse remaining shallow orchestration helpers.
   Once the new owners exist, reduce the amount of knowledge held in
   orchestrator and service-level compose helpers.

## References

- `docs/overview.md:23-36` - documented main execution pipeline
- `apps/cli/src/index.ts:15-18` - multiple `compose` imports with different roles
- `apps/cli/src/index.ts:117-120` - stage-oriented top-level flow
- `apps/cli/src/core/questions/compose.ts:69-87,99-126` - feature decisions collected in question flow
- `apps/cli/src/core/services/compose.ts:22-36,49-61,84-94` - shallow composition helpers
- `apps/cli/src/core/services/orchestrator.ts:33-64` - central coordinator currently owns too many decisions
- `apps/cli/src/core/services/template-engine.ts:17-19,38-104` - strong template runtime boundary with some leakage
- `apps/cli/src/core/services/planner.ts:84-139,161-253,327-378,471-496` - strong plan abstraction but weaker execution ownership
- `apps/cli/src/core/services/fs.ts:25-105` - deep module example
- `apps/cli/src/core/modifier/package-json.ts:23-66` - design decisions expressed in package mutation layer
- `apps/cli/src/core/commands/index.ts:10-58` - design decisions expressed in bootstrap command layer
- `apps/cli/src/core/template-registry/frontend-app.ts:5-80` - shared template registry depending on mixed-semantics config
- `apps/cli/src/core/template-registry/react.ts:6-48` - React-specific render consequences
- `apps/cli/src/core/template-registry/vue.ts:6-48` - Vue-specific render consequences
- `apps/cli/src/schema/project-config.ts:54-60,72-80,92-106` - mixed shared/specialized config model
- `apps/cli/src/types/config.ts:1-21` - main config type export surface
- `apps/cli/src/types/project.ts:1-10` - overlapping secondary type export surface
- `apps/cli/tests/generated-projects.smoke.ts:30-90` - end-to-end generation evidence
- `apps/cli/tests/planner.spec.ts:33-56` - deterministic plan snapshot boundary
- `apps/cli/tests/planner-rollback.test.ts:12-160` - rollback semantics verification
