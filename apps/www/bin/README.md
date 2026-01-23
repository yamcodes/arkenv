# Documentation Scripts (`/bin`)

This directory contains utility scripts used by the documentation site for building, environment setup, and content verification.

## Scripts

### `twoslash-mdx.ts`
The Twoslash Content Parser. This tool allows you to verify how TypeScript code blocks in MDX files will be processed by the documentation site. It uses the same configuration as the live site, including compiler paths, whitelists, and type filters.

**Usage:**
```bash
# From apps/www
pnpm twoslash <path-to-mdx-file>

# Example
pnpm twoslash content/docs/arkenv/index.mdx
```

**Features:**
- **Shared Configuration**: Uses the exact same Twoslash options as the documentation site.
- **JSDoc Support**: Prints documentation strings and hover types exactly as they appear on the site.
- **Whitelist Aware**: Respects whitelisted symbols (like `zod`, `arktype`, `arkenv`) to show relevant type information.
- **Content Verification**: Ideal for checking if your code snippets are correctly typed before deploying.

---

### `build.js`
A compatibility wrapper for running build commands.

- **Node 25+ Support**: Automatically disables Web Storage (`--no-webstorage`) to avoid conflicts during the Next.js build process.
- **Usage**: Called internally by `pnpm build` (e.g., `node ./bin/build next build`).

---

### `postinstall.js`
Handles post-installation tasks for the documentation workspace.

- **MDX Generation**: Runs `fumadocs-mdx` to generate the necessary content collections.
- **Environment Compatibility**: Includes the same Node 25+ Web Storage fixes as the build script.
- **Usage**: Automatically triggered after `pnpm install`, or manual run via `pnpm postinstall`.
