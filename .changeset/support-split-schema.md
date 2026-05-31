---
"@arkenv/nextjs": patch
"@arkenv/cli": patch
---

#### Support split schema layout in Next.js config wrapper

Add support for the strict split schema layout in the Next.js `withArkEnv` configuration wrapper and update CLI scaffolding instructions:
- Add a `layout` option (`"simple" | "strict"`) to `withArkEnv` configuration, which defaults to auto-detecting the strict layout if split files (`env/internal/shared.ts`, `env/client.ts`, `env/server.ts`) exist.
- Implement key extraction from strict client and shared schema files.
- Generate a minimal `runtimeEnv` helper for the strict layout instead of the generic `createEnv` factory.
- Update CLI next-steps messages to include `withArkEnv` wrapping instructions for strict layout nextjs projects.
