# 10. Bundle Isolation trumps DRYness

Date: 2026-06-21

## Status

Accepted

## Context

ArkEnv operates as a zero-dependency environment variable parser. It uses ArkType as its primary validation engine (`arkenv`), while also offering a completely separate entry point (`arkenv/standard`) that leverages Standard Schema 1.0 (for users preferring Zod, Valibot, etc.). 

During the refactoring to a single core repository with multiple internal exports, a code review raised concerns about code duplication between `src/arktype/index.ts` and `src/parse-standard.ts`. Both files implement similar logic for parsing objects, extracting issue metadata, and formatting validation results. The suggestion was to "aggressively unify or codeshare" these implementations to abide by the DRY (Don't Repeat Yourself) principle.

However, sharing utilities across the core ArkType engine and the Standard Schema engine introduces hidden module graph entanglements. Bundlers like Webpack, Rollup, and esbuild often rely on static imports for tree-shaking. A single shared `utils.ts` file imported by both entry points can easily trick the bundler's heuristics into statically tracing the dependency tree back to `arktype`. This would drag the entire 50kb+ ArkType AST engine into the production bundle of users who only wanted to use `arkenv/standard` with Zod.

## Decision

We intentionally duplicate parsing, formatting, and issue-mapping logic across the `arktype` and `standard` engine implementations to maintain an airtight module boundary. **Bundle isolation strictly trumps DRYness across core/standard boundaries.**

We will not create shared abstractions or utility files that bridge these two domains. The small maintenance cost of duplicated internal logic is a worthwhile trade-off to guarantee that `arkenv/standard` users never incur a bundle size penalty from ArkType.

## Consequences

- The footprint of `@arkenv/standard` remains strictly minimal and fully decoupled from ArkType.
- Contributors must be aware that fixing a bug in the error extraction logic for ArkType may require a mirrored fix in the Standard Schema logic.
- Future code reviews raising concerns about DRYness between these files should be directed to this ADR.
