---
"@arkenv/build": patch
"@arkenv/vite-plugin": patch
"@arkenv/bun-plugin": patch
---

#### Consolidate Vite and Bun plugin build plumbing into `@arkenv/build`

Consolidate duplicated build-time utilities between `@arkenv/vite-plugin` and `@arkenv/bun-plugin` into `@arkenv/build` (ADR 0009):
- Move env-module path resolution, module ID normalization, and dotenv detection helpers to `@arkenv/build`.
- Move schema key classification (`classifyEnvKeys`) and dynamic env module loading via `jiti` (`loadValidatedEnv`) to `@arkenv/build`.
- Add shared prefix filtering (`filterEnvByPrefix`) and transform mode detection (`isTransformModeCall`).
- Refactor both plugins to consume these shared utilities while preserving their public APIs and behaviors.
