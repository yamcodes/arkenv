---
"@arkenv/cli": patch
---

#### Add `add host` command to CLI for adding hosting presets to existing schemas

Support adding a hosting provider preset (Vercel or Netlify) to an existing `env.ts` configuration file:

```bash
npx @arkenv/cli@latest add host [provider]
```

- Prompts interactively to select Vercel or Netlify if the provider is omitted.
- Auto-detects the framework (Next.js, Nuxt, Vite, Bun) and the validator engine (Zod, Valibot, or ArkType) to inject the preset fields with the correct syntax.
- Fallback to logging the generated variable schemas to stdout with manual configuration instructions if `env.ts` is missing or unparseable.
