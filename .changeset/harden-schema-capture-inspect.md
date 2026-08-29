---
"arkenv": minor
"@arkenv/core": patch
"@arkenv/standard": patch
"@arkenv/fumadocs-ui": patch
---

#### Harden schema capture for fail-closed inspect

The CLI schema loader now fails closed when it cannot honestly report keys, and returns distinct inspect codes:

- `ERR_INSPECT_NO_CALL` — `arkenv()` was never invoked at module load
- `ERR_INSPECT_UNSUPPORTED` — an installed runtime ignored capture and validated instead
- `ERR_INSPECT_UNEXTRACTABLE` — a captured definition was not a readable static map
- `ERR_INSPECT_EVAL_THROW` — the module threw while using env values at load time

`arkenv({})` remains a valid empty schema. Capture state for core, standard, and the CLI now lives on `Symbol.for("arkenv.schemaCapture.v1")` so it does not collide with Nuxt’s legacy string key. Upgrade `@arkenv/core` / `@arkenv/standard` alongside the CLI so inspect can see the capture flag.

MDX table wrappers in `@arkenv/fumadocs-ui` now include `fd-scroll-container` so wide comparison tables are excluded from `scrollable-region-focusable` the same way as code blocks.
