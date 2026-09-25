---
"@arkenv/build": major
"@arkenv/nextjs": major
"@arkenv/nuxt": major
---

#### Remove the client/server key extractors

`extractClientKeys` and `extractServerKeys` are no longer exported from `@arkenv/build`. `@arkenv/nextjs/config` and `@arkenv/nuxt` (including `@arkenv/nuxt/standard/config`) no longer re-export them. Flat-schema keys still come from `extractKeys` and `classifyEnvKeys`.

**BREAKING CHANGE**: Those helpers scanned a schema file for an `arkenv()` block and returned its keys. Classify a flat `arkenv()` call instead.

```ts
import { classifyEnvKeys } from "@arkenv/build";

const { clientKeys, serverKeys } = classifyEnvKeys(source, ["NEXT_PUBLIC_"]);
```
