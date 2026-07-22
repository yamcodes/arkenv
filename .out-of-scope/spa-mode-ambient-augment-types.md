# SPA-mode ambient augment types (Standard Mode)

ArkEnv does not offer Standard Mode ambient helper types (`ImportMetaEnvAugmented` / `ProcessEnvAugmented` on `/standard` entries) for a schema/define / “SPA mode” path on v1.

## Why this is out of scope

v1 standardizes on a single canonical surface: `import { env } from "./env"`. The product call on [#1333](https://github.com/yamcodes/arkenv/issues/1333) chose **Option 3 (Remove / don’t offer)** for the schema/define path (`arkenv(schema)` + native accessors + `.d.ts` augmentation).

Ambient augment types existed only to type that legacy path. With the path dropped on v1:

- There is no SPA-mode `.d.ts` consumers need to write
- Dual-engine typing for Standard Mode + ambient accessors is unnecessary
- Shipping `/standard` ambient helpers would reintroduce the dialect the call deliberately removed

v0 (`dev`) keeps schema/define working as-is; this rejection applies to the v1 line and to any request to revive ambient SPA typing alongside the unified object surface.

## Prior requests

- [#1440](https://github.com/yamcodes/arkenv/issues/1440) — “(v1) SPA-mode env augment types for /standard (Vite + Bun)”
