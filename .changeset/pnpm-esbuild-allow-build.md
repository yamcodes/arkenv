---
"@arkenv/cli": patch
---

#### Configure pnpm whitelisting for esbuild during scaffolding

Automatically configure pnpm build whitelisting for `esbuild` during project scaffolding if `pnpm` is the detected package manager. This writes the `onlyBuiltDependencies` field to `package.json` and creates or updates a `pnpm-workspace.yaml` file with the `allowBuilds` configuration before running the installation phase.
