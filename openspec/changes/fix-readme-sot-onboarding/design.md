## Context

The root `README.md` is currently a symlink to `packages/arkenv/README.md`. This means there is technically one file — but it serves two surfaces simultaneously: the GitHub repository landing page and the npm package page. The content inside (full QuickStart, feature list, installation blocks for four package managers, requirements, plugins section) is a compromise optimized for neither audience. The docsite at `arkenv.js.org` already serves as the canonical onboarding SoT. Plugin READMEs (`@arkenv/vite-plugin`, `@arkenv/bun-plugin`) already follow the right pattern: concise description, "Read the docs" link, minimal usage, and related links.

## Goals / Non-Goals

**Goals:**
- Break the symlink: give root `README.md` and `packages/arkenv/README.md` separate, distinct content
- Root `README.md`: GitHub landing page — branding, badges, demo GIF, link to docs
- `packages/arkenv/README.md`: npm page — install command, one-liner, link to docs (modeled after plugin READMEs)
- Each file is optimized for its specific surface with no overlapping prose

**Non-Goals:**
- Changing any docsite content
- Restructuring plugin READMEs (already good)
- Changing any package APIs or code
- Full QuickStart content in any README (that stays on the docsite)

## Decisions

### Decision 1: Replace the symlink with two purpose-specific files

**Choice**: Remove the symlink and create two distinct files — one for GitHub, one for npm.

**Rationale**: The symlink is a reasonable mechanism for keeping content in sync, but it forces both surfaces to share one file. GitHub landing pages and npm package pages have different jobs: the former is a marketing surface that should impress and direct; the latter should tell a developer "what is this and how do I install it." A symlink can't serve both optimally.

**Alternative considered**: Keep the symlink but trim the shared content to something minimal that works on both surfaces. Rejected because even minimal content would be a compromise, and breaking the symlink gives flexibility to tailor each surface independently.

### Decision 2: Docsite as single onboarding SoT

**Choice**: Remove full onboarding content from both READMEs and point users to `arkenv.js.org`.

**Rationale**: The docsite already exists and is already maintained. Duplicating it in READMEs created two sources of truth with no mechanism to keep them in sync. Projects like ElysiaJS, Hono, and Fumadocs follow this pattern successfully.

**Alternative considered**: Making the package README the npm SoT and auto-syncing the root README from it (e.g., via a script or CI step). Rejected because it adds CI complexity and the docsite is already the right level of detail for onboarding.

### Decision 2: Root README keeps branding and demo

**Choice**: The root `README.md` retains the logo, badges, demo GIF, and a prominent "Read the docs" CTA — but nothing else from the current duplicated sections.

**Rationale**: The GitHub landing page is a marketing surface; it should create a great first impression and direct users to the full docs. It need not duplicate what the docsite already explains well.

### Decision 3: Package README mirrors plugin READMEs

**Choice**: `packages/arkenv/README.md` is trimmed to match the pattern already established by `@arkenv/vite-plugin` and `@arkenv/bun-plugin`: package name, one-liner, "Read the docs" link, install command, and related links.

**Rationale**: Consistency across all package READMEs. npm users want to know: what is this, how do I install it, where do I learn more. Full feature lists and QuickStarts belong in the docsite.

## Risks / Trade-offs

- **Loss of offline discoverability** → Mitigation: The install command and link to docs remain; users who clone the repo without internet access are a minor edge case.
- **npm page feels sparse** → Mitigation: This matches the established convention for modern JS packages and is a deliberate trade-off for lower maintenance burden.

## Migration Plan

1. Rewrite `README.md` (root) — keep branding/badges/demo, remove duplicated sections
2. Rewrite `packages/arkenv/README.md` — trim to plugin-style format
3. Verify both files render correctly on GitHub and npm (manual spot check)
4. No rollback needed — changes are documentation only with no code impact
