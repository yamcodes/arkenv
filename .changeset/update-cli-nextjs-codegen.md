---
"@arkenv/cli": patch
---

#### Update Next.js scaffolding template to use codegen workflow

Update the CLI `nextjs` scaffolding template to adopt the new `@arkenv/nextjs/config` codegen workflow. The generated `env.ts` file now imports the auto-generated `createEnv` factory from `env.gen.ts` instead of directly importing from `@arkenv/nextjs`, which eliminates the need to manually destructure `runtimeEnv` variables.

Additionally, update the CLI usage instructions to guide developers on wrapping their Next.js configuration using the `withArkEnv` helper inside `next.config.ts`.

#### Add `--no-codegen` CLI option and dedicated prompt for Next.js scaffolding

Introduce a `--no-codegen` (or `-C`) option and an interactive prompt to allow developers to opt out of the Next.js automatic environment variable code generation workflow. When opted out, the CLI scaffolds the project to use standard runtimeEnv destructuring and skips post-scaffold code generation bootstrapping.
