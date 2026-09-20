# ArkEnv v1.0.0 Launch Operations Runbook

This runbook outlines the operational, DNS, npm registry, and deployment
steps required on launch day to transition ArkEnv from `v0` to `v1.0.0`
stable without breaking existing users.

For the earlier **Release Candidate** cut (`1.0.0-rc.n`, channel flip,
install smoke tests, Discussions scan), use
[RC_CHECKLIST.md](./RC_CHECKLIST.md). Do not treat this GA runbook as the
RC checklist, and do not treat the RC checklist as a substitute for these
`1.0.0` steps.

---

## 1. Pre-Launch Checklist (T-Minus 1–3 Days)

- [ ] **v0 Parity & Test Suite**: All unit, integration, and e2e test suites passing across all packages on the `v1` branch. Feature-surface audit (intentional breaks + host map): [`docs/design/v0-parity-audit.md`](./design/v0-parity-audit.md) — still re-confirm CI green before GA day.
- [ ] **Release v0 Docs Snapshot to `arkenv-v0.vercel.app`**:
  - Park the v0 documentation line on the Vercel alias
    `https://arkenv-v0.vercel.app` (Actions: push to `main`, or
    **Deploy www (manual SHA)** → `arkenv-v0.vercel.app`).
  - Do **not** open a js.org subdomain PR for the archive.
  - Verify that old links, guides, and v0 API references resolve correctly.
  - Leave `https://arkenv-dev.vercel.app` in place (do not delete).
- [x] **Alpha Banner on Live v0 Site (`dev` branch)**:
  - Add announcement banner to `arkenv.js.org` (pointing to `https://arkenv-v1.vercel.app` and migration guide) during the final testing window.
- [ ] **README and Production Links**:
  - Update all alpha links (`arkenv-v1.vercel.app`) in READMEs and docs to `arkenv.js.org`.
- [ ] **Changelog Epoch Warnings**:
  - Verify epoch migration warnings are prepended in `packages/arkenv/CHANGELOG.md` and `packages/core/CHANGELOG.md`.
- [ ] **Release Channel + Install Tag Configuration (`apps/www/lib/config/release.ts`)**:
  - For RC: follow [RC_CHECKLIST.md](./RC_CHECKLIST.md) §B — `RELEASE_TAG`
    default `"rc"` (or `NEXT_PUBLIC_ARKENV_RELEASE_TAG="rc"`) for the
    Release Candidate badge; `INSTALL_TAG = ""` for bare install CTAs once
    product `latest` points at RC.
  - For GA: Set `RELEASE_TAG = ""` (badge/channel off). Keep
    `INSTALL_TAG = ""` so homepage buttons, copy actions, AI prompts, and
    docs `package-install` tabs stay bare `npx arkenv init` with 0 MDX diffs.
- [ ] **Local Installation Standard**:
  - Verify docs and installation snippets recommend installing `arkenv` as a local `devDependency` alongside `@arkenv/core` / `@arkenv/standard` for deterministic lockfile-pinned CI builds.

---

## 2. Launch Day: Package Publication & Swaps

### Step 2.1: Exit Pre-Release Mode in Changesets

1. Exit pre-release mode:
   ```bash
   pnpm exec changeset pre exit
   ```
   This sets `.changeset/pre.json` `"mode"` to `"exit"` (it does **not**
   delete the file). The release workflow's "Point latest at published
   RC" step requires `"mode": "pre"` and `"tag": "rc"`, so it stops
   retagging automatically — no separate flag to clear. You can remove
   the `NPM_TOKEN` secret later if it existed only for the RC window
   (that secret is the stage-only dist-tag token; publish stays on OIDC).
2. Generate the final version packages and changelogs:
   ```bash
   pnpm exec changeset version
   ```
   This is what deletes `.changeset/pre.json` after exiting pre.
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

### Step 2.4: Validate CLI Import Guard

- Verify that importing or requiring `arkenv` as a library (`import arkenv from "arkenv"` / `require("arkenv")`) throws the clear runtime error guiding users to `@arkenv/core`.
- Test running `npx arkenv init` in a fresh project to ensure it executes without errors.

---

## 3. Launch Day: Website & Domain Cutover

### Step 3.1: Point Production at v1 (Actions + optional UI)

**Phased cutover (in-repo):**

| Phase | Strategy | Effect |
| --- | --- | --- |
| **Now (RC)** | **Option A** — keep branch names | `v1` → `vercel --prod` (Production / `arkenv.js.org`). `main` → `arkenv-v0.vercel.app` only (not `--prod`). Keep `arkenv-dev.vercel.app` and `arkenv-v1.vercel.app`. |
| **Later (GA)** | **Option B** — rename branches | Move the v1 line onto `main`/`dev`. Rename the old line to **`v0`**. Then leave `--prod` on `main` again. Out of scope for the RC Actions PR. |

**Preferred (RC Option A):** merge the Actions retarget so pushes to
`v1` run `vercel --prod` (Production / `arkenv.js.org`), and pushes to
`main` alias `arkenv-v0.vercel.app` only. Then trigger one `v1` deploy
(push or **Deploy www (manual SHA)** → `arkenv.js.org`).

Also land the same `deploy-www.yml` on **`main`** (cherry-pick) so the
old `main` `--prod` path cannot overwrite apex. Seed
`arkenv-v0.vercel.app` once if the alias does not exist yet (manual SHA
or first `main` push after the workflow lands).

**UI escape hatch:** promote the deployment behind
`https://arkenv-v1.vercel.app` to Production in the Vercel dashboard
(same project; no js.org DNS change).

After cutover:

1. Ensure `https://arkenv-v0.vercel.app` serves the v0 archive.
2. Do **not** delete `arkenv-dev.vercel.app` or `arkenv-v1.vercel.app`.
3. Verify:
   ```bash
   curl -I https://arkenv.js.org
   curl -I https://arkenv-v0.vercel.app
   curl -I https://arkenv-v1.vercel.app
   curl -I https://arkenv-dev.vercel.app
   ```

See also [CONTRIBUTING.md](./CONTRIBUTING.md) (Preview deployments) and
[RC_CHECKLIST.md](./RC_CHECKLIST.md) §E.

### Step 3.2: Verify Key Routes & Redirects

- [ ] Homepage: `https://arkenv.js.org`
- [ ] Migration Guide: `https://arkenv.js.org/docs/guides/migrating-to-v1`
- [ ] Getting Started: `https://arkenv.js.org/docs/getting-started`
- [ ] Framework guides: Next.js, Nuxt, Vite, Bun
- [ ] Legacy docs: `https://arkenv-v0.vercel.app`

---

## 4. Post-Launch Announcements & Communication

- [ ] Publish GitHub Release announcement highlighting `@arkenv/core` and `arkenv` CLI.
- [ ] Social announcements (Twitter / X, Discord, Reddit, Bluesky).
- [ ] Monitor GitHub Issues for any unexpected upgrade regressions or caching issues.

---

## 5. Rollback / Emergency Response

If an emergency regression occurs immediately following publish:

1. **Docs Rollback**: Redeploy the last good v0 SHA to Production
   (**Deploy www (manual SHA)** → `arkenv.js.org`, or promote that
   deployment in the Vercel UI). Manual apex deploys label Vercel git
   metadata as `v1` by default (Production owner). A v0 rollback SHA
   may still show `v1` in the dashboard; the deployed tree is the SHA
   you chose.
2. **npm Rollback**: Check existing dist-tags (`npm view @arkenv/core dist-tags`) and repoint dist-tags on npm:
   ```bash
   npm dist-tag add arkenv@<last-v0-version> latest
   npm dist-tag add arkenv@<last-alpha-version> alpha
   ```
