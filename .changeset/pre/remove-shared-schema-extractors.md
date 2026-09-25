---
"@arkenv/build": major
"@arkenv/nextjs": major
"@arkenv/nuxt": major
---

#### Remove the SharedSchema key extractors

`extractSharedKeys` and `extractSharedBlock` are no longer exported from `@arkenv/build`. `@arkenv/nextjs/config` and `@arkenv/nuxt` (including `@arkenv/nuxt/standard/config`) no longer re-export `extractSharedKeys`. Shared keys in a flat `arkenv()` call still come from `extractKeys` and `classifyEnvKeys`.

**BREAKING CHANGE**: Those helpers scanned source for a `SharedSchema = { ... }` assignment. Classify a flat `arkenv()` call instead.

```ts
import { classifyEnvKeys } from "@arkenv/build";

const { sharedKeys } = classifyEnvKeys(source, ["NEXT_PUBLIC_"]);
```
