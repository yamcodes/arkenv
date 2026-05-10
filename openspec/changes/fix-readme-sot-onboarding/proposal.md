## Why

The root `README.md` is a symlink to `packages/arkenv/README.md`, so there is technically one source of truth — but it's a single file trying to serve two very different surfaces: the GitHub repository landing page and the npm package page. The current content (full QuickStart, feature list, manual installation steps, requirements, etc.) is optimized for neither. The docsite at `arkenv.js.org` already owns full onboarding documentation, making the README content largely redundant and adding maintenance weight any time the docs change.

## What Changes

- The **symlink is removed**: root `README.md` and `packages/arkenv/README.md` become two separate files with distinct purposes.
- The **root `README.md`** becomes the GitHub landing page: branding, badges, demo GIF, and a prominent link to the docsite — no full onboarding content.
- The **`packages/arkenv/README.md`** becomes the npm package page: one-sentence description, install command, and a link to full docs — matching the pattern already established by the plugin READMEs.
- Plugin READMEs (`packages/vite-plugin/README.md`, `packages/bun-plugin/README.md`) are already well-scoped and remain unchanged.

## Capabilities

### New Capabilities

- `readme-docsite-redirect`: Streamlined root and package READMEs that serve as landing/redirect pages pointing users to `arkenv.js.org` for full documentation, following the pattern used by projects like ElysiaJS and Hono.

### Modified Capabilities

_(none — no spec-level behavior changes; this is documentation restructuring only)_

## Impact

- `README.md` (root) — symlink replaced with a standalone file
- `packages/arkenv/README.md` — rewritten to be npm-focused
- No code, API, or dependency changes
- No docsite content changes (docsite is already the SoT for full docs)
