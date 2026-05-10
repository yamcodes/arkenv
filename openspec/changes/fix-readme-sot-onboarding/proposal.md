## Why

Every package in the repo has a README with Quickstart, Features, and Usage content — and the docsite has separate MDX pages covering the exact same ground for each package. This creates multiple independent sources of truth that drift apart over time:

- `packages/arkenv/README.md` ↔ `apps/www/content/docs/arkenv/quickstart.mdx`
- `packages/vite-plugin/README.md` ↔ `apps/www/content/docs/vite-plugin/index.mdx`
- `packages/bun-plugin/README.md` ↔ `apps/www/content/docs/bun-plugin/index.mdx`
- `packages/cli/README.md` ↔ `apps/www/content/docs/cli/index.mdx`

The docsite already holds richer, more current content (twoslash examples, MDX components, more complete usage). The READMEs are a maintenance burden: any docsite improvement must be manually back-ported to the README, and vice versa — and often isn't.

## What Changes

Each package README is repurposed from a "mini-docsite" to a **thin npm landing page**: one-sentence description, install command, and a link to the docsite. The docsite remains unchanged and becomes the undisputed SoT for all onboarding content.

Affected READMEs:
- `packages/arkenv/README.md` (currently a symlink to root — symlink is preserved, content of the target is trimmed)
- `packages/vite-plugin/README.md`
- `packages/bun-plugin/README.md`
- `packages/cli/README.md`

## Capabilities

### New Capabilities

- `readme-npm-landing`: All package READMEs follow a minimal, consistent npm-landing-page pattern — name, one-liner, install snippet, "Read the docs" link — with no onboarding content that could drift from the docsite.

### Modified Capabilities

_(none — no spec-level behavior changes; docsite content is unchanged)_

## Impact

- `packages/arkenv/README.md` — trimmed (symlink target)
- `packages/vite-plugin/README.md` — trimmed
- `packages/bun-plugin/README.md` — trimmed
- `packages/cli/README.md` — trimmed
- No docsite changes
- No code, API, or dependency changes
