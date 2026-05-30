---
"@arkenv/nextjs": patch
---

#### Add `withArkEnv` configuration helper for Next.js

Add a Next.js configuration wrapper in `@arkenv/nextjs/config` that automates `runtimeEnv` destructuring:

```js
// next.config.js
const { withArkEnv } = require("@arkenv/nextjs/config");
module.exports = withArkEnv({
  reactStrictMode: true,
});
```

It statically extracts `client` and `shared` keys from `env.ts` and auto-generates a tailored `createEnv` factory inside `env.gen.ts` to pre-fill the `runtimeEnv` block. This allows developers to define schemas in `env.ts` and import from `./env` without manually writing or keeping any `runtimeEnv` boilerplate in sync.
