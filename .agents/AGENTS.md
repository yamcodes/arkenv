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

3. **Changelog Epoch Warnings (Right before v1.0.0 release)**:
   - In `packages/arkenv/CHANGELOG.md`, prepend a prominent warning alerting users that `arkenv` is now the CLI, not the library.
   - In `packages/core/CHANGELOG.md`, prepend a welcome header explaining that the core library has moved from `arkenv` to `@arkenv/core`.

4. **CLI Import Restriction**:
   - The `arkenv` CLI package (`packages/arkenv`) must throw a clear error at runtime if imported or required as a library (using `require.main !== module`) to prevent accidental usage by users upgrading from `v0`.
