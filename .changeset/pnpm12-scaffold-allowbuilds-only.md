---
"arkenv": patch
---

#### Stop writing pnpm onlyBuiltDependencies into package.json

When scaffolding with pnpm, ArkEnv now only updates `pnpm-workspace.yaml` with `allowBuilds` for approved native deps (such as `esbuild`). It no longer mutates `package.json#pnpm.onlyBuiltDependencies`, which pnpm 12 ignores.
