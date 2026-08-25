---
"@arkenv/nextjs": minor
---

#### Support function-form `next.config` in `withArkEnv`

`withArkEnv` now accepts Next.js function-form configs (sync or async). The wrapper awaits the user's factory with the `phase` and context Next.js provides, then applies strict-layout and `.arkenv/` aliases to the resolved object.

```ts
import { withArkEnv } from "@arkenv/nextjs/config";

export default withArkEnv(async (phase, { defaultConfig }) => ({
	...defaultConfig,
	reactStrictMode: phase !== "phase-test",
}));
```
