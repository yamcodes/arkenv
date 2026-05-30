---
"@arkenv/cli": patch
---

#### Update Next.js scaffolding template to use codegen workflow

Update the CLI `nextjs` scaffolding template to adopt the new `@arkenv/nextjs/config` codegen workflow. The generated `env.ts` file now imports the auto-generated `createEnv` factory from `env.gen.ts` instead of directly importing from `@arkenv/nextjs`, which eliminates the need to manually destructure `runtimeEnv` variables.

Additionally, update the CLI usage instructions to guide developers on wrapping their Next.js configuration using the `withArkEnv` helper inside `next.config.ts`.
