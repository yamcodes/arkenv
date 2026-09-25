## Agent skills

### Issue tracker

GitHub issues tracked via the `gh` CLI. See `.agent/docs/issue-tracker.md`.

### Triage labels

Custom vocabulary mapped to GitHub labels (e.g., `needs triage`, `needs more info`). See `.agent/docs/triage-labels.md`.

### Domain docs

Single-context layout with `CONTEXT.md` in the `docs/` directory. See `.agent/docs/domain.md`.

### v1 Roadmap package migration rules

For all work transitioning or porting features from the `v0` (dev) branch to the `v1` branch, follow these policies:

1. **Changeset Translation Matrix (Dual-Tracking)**:
   - When importing changesets from `v0` to `v1`, you must translate the package names in the YAML frontmatter:
     - If the change is in the CLI/Scaffolding: `@arkenv/cli` (v0) ➔ `arkenv` (v1)
     - If the change is in the Core Validation engine: `arkenv` (v0) ➔ `@arkenv/core` (v1)

2. **Changelog Identity Swaps**:
   - `packages/cli/CHANGELOG.md` maps to `packages/arkenv/CHANGELOG.md`.
   - `packages/arkenv/CHANGELOG.md` (the old core) maps to `packages/core/CHANGELOG.md`.

3. **Changelog Epoch Warnings** (shipped for RC on `latest`, not held for `1.0.0`):
   - `packages/arkenv/CHANGELOG.md` warns that `arkenv` is the CLI, not the library.
   - `packages/core/CHANGELOG.md` welcomes readers to the runtime that moved from `arkenv` to `@arkenv/core`.
   - Both banners sit in an `<!-- arkenv-epoch -->` block directly under the heading and link to the v1 migration guide. `changeset version` inserts the next release under the heading, so `scripts/changeset-version.js` hoists that block back to the top.

4. **CLI Import Restriction**:
   - The `arkenv` CLI package (`packages/arkenv`) must throw a clear error at runtime if imported or required as a library (using `require.main !== module`) to prevent accidental usage by users upgrading from `v0`.

5. **Release Channel vs Install CTAs (`RELEASE_TAG` / `INSTALL_TAG`)**:
   - Channel labeling (`"alpha"`, `"rc"`, `""` for GA) is controlled by `RELEASE_TAG` in `apps/www/lib/config/release.ts`. It drives the Release Candidate badge and channel copy — not install CTAs.
   - User-facing install / init / MDX `package-install` tabs use `INSTALL_TAG` (via `getPackageSpecifier`, `getInitCommand`, and `normalizePackageManagerCommand`). Empty `INSTALL_TAG` yields bare commands (`npx arkenv init`, `pnpm add @arkenv/core`).
   - Keep them independent when you want an RC badge while advertising bare installs (after product `latest` → RC and the apex docs cutover). Flip `RELEASE_TAG` alone when graduating the badge/channel; flip `INSTALL_TAG` alone when you need tagged install copy again.

6. **Pending changesets vs `.changeset/pre/`** (hard rule on `v1` / any pre-mode branch):
   - Write new changesets only as `.changeset/<name>.md`.
   - **Never** create pending changesets under `.changeset/pre/` — that folder is the consumed archive filled by `changeset version` / Version Packages PRs.
   - `changesets/action` ignores `pre/` and will log “No changesets found”, so the package never bumps (missed release after #2022).
   - Follow the changeset skill (`.agents/skills/changeset/SKILL.md`) for voice, bumps, and this path rule.
