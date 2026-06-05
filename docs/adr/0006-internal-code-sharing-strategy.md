# Internal Code Sharing & Plugin Architecture

## Context

As ArkEnv grows, we needed a strategy to share internal helpers (like ArkType scope extensions and TypeScript types) across the core library and its plugins (`@arkenv/vite-plugin`, `@arkenv/bun-plugin`, etc.). We evaluated two diverging paths for code sharing, and two diverging paths for plugin integration.

### Decision 1: Code Sharing (Single Core vs. Micro-Packages)

We considered publishing small packages for every shared need (e.g., `@arkenv/scope`, `@arkenv/types`). While this honors a "0 external dependencies" philosophy, it introduces severe **Version Skew Risks**. If two plugins resolve to different versions of `@arkenv/scope`, ArkType will instantiate multiple root scopes, causing validation and `instanceof` checks to fail silently. Furthermore, publishing internal types binds us to SemVer for code that is fundamentally unstable.

**Decision:** We chose a **Single Core with `/internal` Exports**. The core package (`arkenv`, soon to be `@arkenv/core`) is the single source of truth. Shared internals are exposed via an explicit `exports: { "./internal": ... }` subpath. This guarantees a single instantiated scope, explicitly signals instability to users, and avoids bloating the main `index.mjs` bundle size constraint (2kb) by separating internal code at the bundler level.

### Decision 2: Plugin Architecture (Wrapper vs. Peer Dependency)

We evaluated whether plugins should depend directly on the core (The Wrapper - Path A) or require the user to install and wire them together manually (Side-by-Side / Peer Dependency - Path B).

**Decision:** We chose **The Wrapper (Path A)**. Plugins list the core package as a direct `dependency`.

- **Pros:** Elite Developer Experience (a single install command) and foolproof versioning (the plugin dictates the exact core version it needs, preventing mismatch errors).
- **Cons:** Internal API Leakage. The wrapper requires deep access to internals, which forces us to expose the `./internal` subpath in the core package. We accept this trade-off because the DX benefits heavily outweigh the architectural impurity.
