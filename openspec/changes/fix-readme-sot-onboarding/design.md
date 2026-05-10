## Context

Each ArkEnv package (core, vite-plugin, bun-plugin, cli) has a README with Quickstart/Features/Usage content. The docsite at `arkenv.js.org` has corresponding MDX pages covering the same ground — with richer content (twoslash type hints, interactive tabs, more complete usage examples). Both are maintained independently, so they drift. The docsite is consistently more up to date.

The root `README.md` is a symlink to `packages/arkenv/README.md` — this is intentional and stays.

## Goals / Non-Goals

**Goals:**
- Make the docsite the unambiguous SoT for all onboarding and usage content
- Trim all four package READMEs to a minimal npm-landing-page format: name, description, install, "Read the docs" link
- Establish a consistent pattern across all READMEs that's easy to maintain

**Non-Goals:**
- Changing any docsite content
- Removing the symlink between root `README.md` and `packages/arkenv/README.md`
- Changing any package code or APIs
- Adding new docsite pages

## Decisions

### Decision 1: Docsite wins; READMEs become thin landing pages

**Choice**: Trim READMEs to the minimum useful for an npm package page. The docsite holds all real content.

**Rationale**: The docsite already has better content — interactive tabs, twoslash examples, cross-links. There's no benefit to keeping a lower-fidelity copy in each README. npm users just need to know what the package does and where to go next.

**Alternative considered**: Make READMEs the SoT and sync docsite from them. Rejected: docsite MDX uses rich components (Tabs, Steps, twoslash) that can't be generated from plain Markdown.

### Decision 2: Consistent README format across all packages

**Choice**: Every package README follows the same template: `# Package name`, one-sentence description, `## [Read the docs →](url)`, install snippet, `## Related` links.

**Rationale**: This is already the de facto pattern for `@arkenv/vite-plugin` and `@arkenv/bun-plugin` (somewhat). Making it explicit and consistent across all packages makes the expectation clear for future contributors.

### Decision 3: Preserve the root README symlink

**Choice**: Keep `README.md → packages/arkenv/README.md` symlink intact.

**Rationale**: A trimmed `packages/arkenv/README.md` will work fine as both the npm page and the GitHub landing page. Breaking the symlink adds complexity without benefit once the README content is minimal. The GitHub landing page can link to the docsite just as well as a separate file could.

## Risks / Trade-offs

- **GitHub landing page feels sparse** → Mitigation: The current branding (logo, badges, demo GIF) at the top of the package README is still there; only the duplicated prose sections are removed.
- **npm users lose inline docs** → Mitigation: This matches the convention for modern JS packages and is a deliberate trade-off for a single SoT.

## Migration Plan

1. Trim `packages/arkenv/README.md` (root symlink updates automatically)
2. Trim `packages/vite-plugin/README.md`
3. Trim `packages/bun-plugin/README.md`
4. Trim `packages/cli/README.md`
5. Spot-check all four on GitHub and npm previews
