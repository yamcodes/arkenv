---
"arkenv": patch
---

#### Generate `.env` and `.env.example` files and configure pnpm approved builds whitelisting during initialization

- Generate default `.env` and `.env.example` files during initialization if they do not exist to prevent Node/tsx `--env-file` boot crashes.
- Parse existing `.env` file and securely strip all values to generate `.env.example` when `.env.example` is missing to avoid leaking user credentials to source control.
- Automatically check and update `.gitignore` in existing projects to ignore `.env` and `.env.local` files.
- Skip overwriting pre-existing files when their scaffolding action is set to `"create"`.
- Configure pnpm build whitelisting for `esbuild` during project scaffolding if `pnpm` is the detected package manager. This writes the `onlyBuiltDependencies` field to `package.json` and creates or updates a `pnpm-workspace.yaml` file with the `allowBuilds` configuration before running the installation phase.
