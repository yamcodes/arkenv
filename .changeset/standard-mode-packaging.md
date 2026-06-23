---
"@arkenv/core": major
"@arkenv/standard": major
"@arkenv/vite-plugin": major
"@arkenv/bun-plugin": major
"@arkenv/nextjs": major
"@arkenv/nuxt": major
---

#### Split core engine into `@arkenv/core` and `@arkenv/standard` and add standard subpath exports to framework plugins

Introduce `@arkenv/standard` as a dependency-free validation engine for Standard Schema validators (e.g., Zod, Valibot), and rename the main `arkenv` package to `@arkenv/core` (with `arktype` as a required peer dependency).

Framework plugins (`@arkenv/nextjs`, `@arkenv/nuxt`, `@arkenv/vite-plugin`, `@arkenv/bun-plugin`) now export a `/standard` subpath to allow using Standard Schema mode without any dependency on `arktype`.

Example using `@arkenv/standard`:

```ts
import arkenv from "@arkenv/standard";
import { z } from "zod";

export const env = arkenv({
	PORT: z.coerce.number().default(3000),
});
```

Example of Vite plugin configuration in Standard Mode:

```ts
import arkenv from "@arkenv/vite-plugin/standard";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [arkenv()],
});
```

**BREAKING CHANGE:** The package `arkenv` has been renamed to `@arkenv/core`. Framework plugins now list `@arkenv/core` and `@arkenv/standard` as optional peer dependencies. You must install either `@arkenv/core` (if using ArkType) or `@arkenv/standard` (if using Standard Schema).
