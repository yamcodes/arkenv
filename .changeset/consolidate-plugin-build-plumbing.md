---
"@arkenv/build": patch
"@arkenv/vite-plugin": patch
"@arkenv/bun-plugin": patch
---

#### Consolidate Vite and Bun plugin build plumbing into `@arkenv/build`

Consolidated duplicated build-time utilities across `@arkenv/vite-plugin` and `@arkenv/bun-plugin` into `@arkenv/build` in accordance with ADR 0009:
- Centralized env-module path resolution, module ID normalization, and dotenv detection helpers in `@arkenv/build`.
- Moved schema key classification (`classifyEnvKeys`) and dynamic env module loading via `jiti` (`loadValidatedEnv`) into `@arkenv/build`.
- Added shared prefix filtering (`filterEnvByPrefix`) and transform mode detection (`isTransformModeCall`).
- Refactored both plugins to consume these shared utilities while preserving their public APIs and behaviors.
