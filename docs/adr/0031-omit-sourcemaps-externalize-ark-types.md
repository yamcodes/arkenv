# ADR 0031: Omit Sourcemaps and Externalize ArkType Type Contracts

## Status

Accepted

## Context

> **Originating issue:** [#1726 – Reduce package install sizes](https://github.com/yamcodes/arkenv/issues/1726)

ArkEnv's published npm packages were shipping three categories of waste that inflated install sizes without providing any meaningful consumer benefit:

### 1. Declaration maps (`.d.ts.map`)

`declarationMap: true` in `tsconfig.json` emits a `.d.ts.map` file alongside every `.d.ts` / `.d.mts` declaration file. These maps are only useful when the compiler can also serve the corresponding **raw `.ts` source files** — enabling an IDE's "Go to Definition" command to jump into the uncompiled source. ArkEnv publishes compiled output only; the `.ts` sources are never included in the npm artifact. Declaration maps therefore landed in the tarball as dead weight, contributing hundreds of kilobytes across the monorepo without unlocking any navigation path.

### 2. Runtime sourcemaps (`.js.map`)

`sourcemap: true` in `tsdown.config.ts` emits a `.js.map` file for every compiled bundle. Runtime sourcemaps help map minified stack traces back to source lines. ArkEnv does not minify its output (line numbers already correspond to readable bundle code), and end-users debugging ArkEnv internals operate against the published package with IDE-level source navigation, not crash-report symbolication. The maps added size without a realistic use case for library consumers.

### 3. ArkType internals inlined into declaration files

The deeper problem was one of type-level bloat. ArkEnv's internal `@repo/scope` package exposed a scope instance typed as `Scope<$>`, and the core package re-exported `type` as `$.type` (i.e., `Scope<$>["type"]`). When `tsc` encountered these opaque types without explicit public-surface annotations, it recursively chased their generic parameters through `@ark/util`'s internal AST helpers and inlined the entire expanded tree into `@arkenv/core`'s `.d.mts` files. A single file grew from \~17 kB to \~337 kB; the full `@arkenv/core` tarball ballooned from \~90 kB to over 1.6 MB.

Two structural issues forced this inlining:

- `packages/internal/types/src/schema.ts` typed `CompiledEnvSchema` against `Type<SchemaShape, $>`, dragging the concrete scope `$` (and all of ArkType's inferred AST surface) into the type graph of `@repo/types`.
- Usages of `type.Any` and `type.errors` inside `@arkenv/core` referenced private ArkType classes rather than the stable public surface types (`Type<U, any>` and `ArkErrors`).

## Decision

### Eliminate declaration maps and runtime sourcemaps monorepo-wide

Set `"declarationMap": false` in all `packages/*/tsconfig.json` files and `sourcemap: false` in all `packages/*/tsdown.config.ts` files. These are both already the default for compiled libraries distributed without accompanying source; making them explicit removes any risk of a future tooling upgrade silently re-enabling them.

### Externalize ArkType type contracts at the correct abstraction level

Replace private type references with the narrowest stable public surfaces:

- **`packages/internal/scope/src/root.ts`** — export `$` with a plain `Scope<$>` annotation (no `as never` cast). A plain assignment typechecks correctly and preserves assignability checks.
- **`packages/core/src/index.ts`** — annotate `type` as `Scope<$>["type"]` so `tsc` emits the minimal structural alias instead of expanding `Scope` internals.
- **`packages/core/src/arkenv.ts`** — replace `at.Any<infer U, infer _Scope>` with `Type<infer U, any>`, the public `arktype` surface.
- **`packages/internal/types/src/infer-type.ts`** — replace `type.errors` with `ArkErrors`, the stable exported error class.
- **`packages/internal/types/src/schema.ts`** — change the `CompiledEnvSchema` type parameter from `Type<SchemaShape, $>` to `Type<SchemaShape, any>`, decoupling `@repo/types` from the concrete scope and breaking the import cycle that forced `@repo/scope` into `@repo/types`'s dependency graph.

### Guarantee bundler-level externalization

Add `neverBundle: ["arktype", "@ark/util", "@ark/schema", "arkregex"]` to `tsdown.config.ts` in `packages/core`, `packages/internal/scope`, and `packages/internal/utils`. This prevents tsdown from ever re-bundling ArkType's modules into `@arkenv/core`'s runtime artifact even if a future refactor accidentally reintroduces a direct import.

## Consequences

**Positive:**

- `@arkenv/core` ships at **\~90 kB unpacked / \~25 kB gzipped** instead of >1.6 MB — a >18× reduction in install footprint.
- Zero `.map` files in any published package; `npm pack --dry-run` output is now predictable and minimal.
- Declaration files now reference ArkType's stable public `./internal/` subpath exports rather than expanding AST internals, significantly reducing IDE language-server memory use for consumers.
- The `@repo/types` → `@repo/scope` import cycle is broken; the type `CompiledEnvSchema` is now scope-agnostic, which means any `Type<SchemaShape, any>` satisfies `Infer<T>` regardless of which scope produced it. This has no runtime impact.

**Negative / Trade-offs:**

- The floor on declaration-file size is now set by how granular ArkType's own `./internal/` subpath exports are. If a future ArkType minor restructures those subpaths, we may need to revisit our public-surface annotations.
- `Type<SchemaShape, any>` as the `CompiledEnvSchema` bound is marginally wider than `Type<SchemaShape, $>`. Schemas produced by a foreign scope could satisfy the type at compile time (though they would still validate correctly at runtime, as validation is scope-agnostic for standard shapes).
- Contributors must keep `@repo/types` free of direct `@repo/scope` imports. The absence of that dependency in `packages/internal/types/package.json` enforces this at package-manager level; any re-introduction will cause a workspace resolution error before CI runs.
