---
"@arkenv/cli": minor
---

#### Respect `tsconfig.json` for path resolution and scaffolding

The Arkenv CLI now dynamically resolves configuration paths and scans project files by respecting `tsconfig.json` settings (`rootDir`, `paths`, `baseUrl`).

Key improvements include:
- **Robust `tsconfig` Parser**: Added support for parsing `tsconfig.json` files with comments (`jsonc-parser`), handling `extends`, `rootDir`, `baseUrl`, and `paths` alias resolution.
- **Dynamic Scaffolding Defaults**: Updated `init` scaffolding logic to suggest project-appropriate default paths based on `compilerOptions.rootDir` rather than hardcoding `./src/env.ts`.
- **Advanced Environment Scanning**: Enhanced `getEnvExampleKeys` to scan project source files for `process.env` and `import.meta.env` usages, correctly resolving aliased imports (e.g. `@/env`).
- **Framework & Package Manager Detection**: Leveraged parsed `tsconfig.json` context to accurately identify project frameworks and package managers.
