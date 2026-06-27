---
"@arkenv/nextjs": patch
"@arkenv/cli": patch
---

#### Add `codegen: false` support to `@arkenv/nextjs/config`

Introduce the `codegen?: boolean` config option. When `codegen` is `false`, code generation is skipped during Next.js build-time bootstrapping, but environment variable validation is still executed. The CLI's `--no-codegen` flag now skips generating `env.gen.ts` during scaffolding while still wrapping `next.config.ts` with `withArkEnv(nextConfig, { codegen: false })`.
