# ArkEnv v1.0.0 Launch Operations Runbook

This runbook outlines the operational, DNS, npm registry, and deployment steps required on launch day to transition ArkEnv from `v0` to `v1.0.0` stable without breaking existing users.

---

## 1. Pre-Launch Checklist (T-Minus 1–3 Days)

- [ ] **v0 Parity & Test Suite**: All unit, integration, and e2e test suites passing across all packages on the `v1` branch.
- [ ] **Release v0 Docs Snapshot to `v0.arkenv.js.org`**:
  - Deploy a frozen snapshot of the `dev` (v0) documentation branch to Vercel/Cloudflare Pages.
  - Assign domain: `v0.arkenv.js.org`.
  - Verify that old links, guides, and v0 API references resolve correctly.
- [x] **Alpha Banner on Live v0 Site (`dev` branch)**:
  - Add announcement banner to `arkenv.js.org` (pointing to `https://arkenv-v1.vercel.app` and migration guide) during the final testing window.
- [ ] **README and Production Links**:
  - Update all alpha links (`arkenv-v1.vercel.app`) in READMEs and docs to `arkenv.js.org`.
- [ ] **Changelog Epoch Warnings**:
  - Verify epoch migration warnings are prepended in `packages/arkenv/CHANGELOG.md` and `packages/core/CHANGELOG.md`.
- [ ] **Release Channel Tag Configuration (`apps/www/lib/config/release.ts`)**:
  - For RC: Update `RELEASE_TAG = "rc"` in `apps/www/lib/config/release.ts` (or override via `NEXT_PUBLIC_ARKENV_RELEASE_TAG="rc"`).
  - For GA: Set `RELEASE_TAG = ""` so that all UI buttons, copy actions, AI prompts, and docs `package-install` tabs automatically render bare `npx arkenv init` with 0 MDX diffs.
- [ ] **Local Installation Standard**:
  - Verify docs and installation snippets recommend installing `arkenv` as a local `devDependency` alongside `@arkenv/core` / `@arkenv/standard` for deterministic lockfile-pinned CI builds.

---

## 2. Launch Day: Package Publication & Swaps

### Step 2.1: Exit Pre-Release Mode in Changesets

1. Exit pre-release mode:
   ```bash
   pnpm exec changeset pre exit
   ```
2. Generate the final version packages and changelogs:
   ```bash
   pnpm exec changeset version
   ```
3. Commit and merge the Version Packages PR to `v1`.

### Step 2.2: Promote Packages to `@latest`

When GitHub Actions triggers the release workflow, verify on npm that:

- `arkenv@1.0.0` is published under the `latest` tag (as the CLI).
- `@arkenv/core@1.0.0` is published under the `latest` tag (as the core runtime).
- `@arkenv/standard`, `@arkenv/nextjs`, `@arkenv/nuxt`, `@arkenv/vite-plugin`, `@arkenv/bun-plugin`, `@arkenv/build`, `@arkenv/fumadocs-ui` are published under `latest`.
- Note: `@arkenv/agent-plugin` is versioned independently on its own `0.x` cadence.

### Step 2.3: Deprecate `@arkenv/cli`

Execute npm deprecation for the old v0 CLI package name:

```bash
npm deprecate @arkenv/cli "This package was renamed to 'arkenv' in v1. Please update your dependencies: 'npm i -D arkenv' and use '@arkenv/core' for runtime validation."
```

### Step 2.4: Validate CLI Postinstall & Import Guards

- Verify that `npm install arkenv` / `import arkenv from "arkenv"` throws the clear runtime error guiding users to `@arkenv/core`.
- Test running `npx arkenv init` in a fresh project to ensure it executes without errors.

---

## 3. Launch Day: Website & Domain Cutover

### Step 3.1: Switch Domain in Vercel

1. In Vercel Project Settings for the v1 Docs app (`arkenv-v1`):
   - Add Domain: `arkenv.js.org` (and set as primary domain).
2. Remove/redirect old domain mapping from the v0 project:
   - Ensure `v0.arkenv.js.org` remains live and accessible.
3. Verify DNS propagation:
   ```bash
   curl -I https://arkenv.js.org
   curl -I https://v0.arkenv.js.org
   ```

### Step 3.2: Verify Key Routes & Redirects

- [ ] Homepage: `https://arkenv.js.org`
- [ ] Migration Guide: `https://arkenv.js.org/docs/guides/migrating-to-v1`
- [ ] Getting Started: `https://arkenv.js.org/docs/getting-started`
- [ ] Framework guides: Next.js, Nuxt, Vite, Bun
- [ ] Legacy docs: `https://v0.arkenv.js.org`

---

## 4. Post-Launch Announcements & Communication

- [ ] Publish GitHub Release announcement highlighting `@arkenv/core` and `arkenv` CLI.
- [ ] Social announcements (Twitter / X, Discord, Reddit, Bluesky).
- [ ] Monitor GitHub Issues for any unexpected upgrade regressions or caching issues.

---

## 5. Rollback / Emergency Response

If an emergency regression occurs immediately following publish:

1. **Docs Rollback**: Point `arkenv.js.org` back to the v0 project in Vercel.
2. **npm Rollback**: Check existing dist-tags (`npm view @arkenv/core dist-tags`) and repoint dist-tags on npm:
   ```bash
   npm dist-tag add arkenv@<last-v0-version> latest
   npm dist-tag add arkenv@<last-alpha-version> alpha
   ```
