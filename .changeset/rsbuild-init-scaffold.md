---
"arkenv": minor
---

#### feat(cli): Rsbuild template detection and scaffolding in `arkenv init`

Added first-class support for Rsbuild in `arkenv init`:
- Detects `@rsbuild/core` in project dependencies or `rsbuild.config.*` files.
- Adds `@arkenv/rsbuild-plugin` to project dependencies during initialization.
- Bootstraps `rsbuild.config.*` files by injecting `arkenvRsbuildPlugin()`.
- Sets default client prefix to `PUBLIC_`.
