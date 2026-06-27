---
"@arkenv/nextjs": patch
"@arkenv/cli": patch
---

#### Add `codegen: false` support and `globalThis` build-time validation flag

Introduce the `codegen?: boolean` config option. When `codegen` is `false`, code generation is skipped during Next.js build-time bootstrapping, but environment variable validation is still executed. Refactored build-time validation to use a transient `globalThis` flag instead of process environment mutation, preventing runtime SSR pollution.
