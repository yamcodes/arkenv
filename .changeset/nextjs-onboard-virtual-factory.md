---
"arkenv": patch
"@arkenv/nextjs": patch
---

#### Align Next.js onboarding with `@/.arkenv`

`arkenv init` now scaffolds Next.js schemas that import the codegen factory from `@/.arkenv`, writes that factory to `.arkenv/env.gen.ts`, gitignores `.arkenv/`, and maps the specifier in `tsconfig.json`. Docs, READMEs, and examples match that path instead of `./generated/env.gen`.

```ts
import arkenv from "@/.arkenv";

export const env = arkenv({
  DATABASE_URL: "string",
  NEXT_PUBLIC_API_URL: "string",
});
```

Existing `outputPath` overrides still work. Keep importing `@/.arkenv`. `withArkEnv` aliases the specifier for bundlers, and codegen keeps `.arkenv/index.ts` re-exporting the file so `tsc --noEmit` resolves it too.
