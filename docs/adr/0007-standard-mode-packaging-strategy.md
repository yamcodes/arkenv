# Standard Mode Packaging Strategy

## Context
With the introduction of the "Standard Schema" implementation (which strictly removes ArkType dependencies) and the migration to the `@arkenv` scope, we face a decision on how to distribute the "Standard Mode" across the core library and its framework plugins.

The decision is asymmetric:
1.  **The Core Engine:** We are splitting the core into two separate packages (`@arkenv/core` for ArkType, and `@arkenv/standard` for Standard Schema).
2.  **The Framework Plugins:** We are **not** splitting the plugins into separate packages (e.g., we will not create `@arkenv/vite-plugin-standard`). Instead, a single plugin package will support both engines via subpath exports (e.g., `import arkenv from "@arkenv/vite-plugin/standard"`).

## Decision: Why the Asymmetry?

We have chosen this asymmetric packaging strategy for three primary reasons:

### 1. The N-Multiplier Effect
If we mandate that every engine requires a separate package, adding support for a new framework requires creating two new packages (e.g., `@arkenv/bun-plugin` and `@arkenv/bun-plugin-standard`). If we ever add a third engine, we'd need three packages per framework. By using subpath exports in the plugins, we maintain a 1:1 ratio between frameworks and plugin packages. This dramatically reduces repository and npm namespace bloat.

### 2. Perfect Sibling Symmetry & Discoverability
By extracting `@arkenv/standard` into its own package, we achieve perfect sibling symmetry: `@arkenv/core` represents the primary ArkType engine, and `@arkenv/standard` represents the alternative Standard Schema engine. This elevates Standard Mode to a first-class citizen, providing a massive discoverability benefit for Zod and Valibot users who no longer have to install a package whose primary identity is built around ArkType.

### 3. Zero Peer Dependency Confusion
The engines have fundamentally different dependency requirements. The core requires `arktype`, while the standard mode is dependency-free. Splitting them allows `@arkenv/core` to list `arktype` as a *required* peer dependency, while `@arkenv/standard` has zero peer dependencies. This is much cleaner for package managers than relying on complex `peerDependenciesMeta: { optional: true }` configurations at a unified core level.

### 4. Shared Internals (Enabler)
This split is made architecturally feasible because we are already adopting an "inlined internal packages" strategy. We can easily extract the shared `parse-standard` and `guards` logic into an internal `@repo/utils` package, and bundle that into both `@arkenv/core` and `@arkenv/standard` at publish time without creating dual-package hazards.

### 5. Plugins are Thin Routers
Framework plugins do not implement parsing or evaluation logic; they are essentially dependency-injectors that bridge the build tool to the engine. Because they are lightweight, a single plugin package can safely list both `@arkenv/core` and `@arkenv/standard` as optional peer dependencies. The user installs the engine they want, imports the correct plugin subpath, and the bundler tree-shakes the unused path. There is no risk of leaking heavy dependencies.

## Consequences
*   **Positive:** The npm ecosystem remains clean (fewer packages).
*   **Positive:** Users only download the dependencies they actually need (ArkType vs Standard).
*   **Negative:** Plugin maintainers must ensure their `package.json` correctly exposes multiple `"exports"` and manages dual optional peer dependencies.
