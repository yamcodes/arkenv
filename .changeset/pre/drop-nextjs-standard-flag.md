---
"@arkenv/nextjs": major
---

#### Remove the public `standard` option from `withArkEnv`

`withArkEnv` from `@arkenv/nextjs/config` no longer accepts `{ standard }`. Standard Schema codegen is selected by importing `withArkEnv` from `@arkenv/nextjs/standard/config`. That entry still forces generated `env.gen.ts` to import `@arkenv/nextjs/standard`.

```ts
import { withArkEnv } from "@arkenv/nextjs/standard/config";

export default withArkEnv(nextConfig);
```

**BREAKING CHANGE**: `withArkEnv` no longer accepts `{ standard }`. Select Standard Schema codegen by importing from `@arkenv/nextjs/standard/config`.
