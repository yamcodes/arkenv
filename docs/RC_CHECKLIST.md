# ArkEnv Release Candidate checklist

Maintainer checklist for cutting the first `1.0.0-rc.n` from the `v1`
branch. Use it to park open work, flip the in-repo release channel, publish,
and smoke-test installs. It does **not** replace the GA launch steps in
[LAUNCH_RUNBOOK.md](./LAUNCH_RUNBOOK.md).

Verified against tip `af94f540` on `v1` (2026-09-12). Re-check open
PRs, Discussions, and `ROADMAP_EXTRAS` before you execute a cut.

<!-- prettier-ignore -->
> [!NOTE]
> Shortest critical path: **A** (product freeze) → **B** (channel flip)
> → **C** (publish + smoke). DNS, announce, and social are a same-day
> pack after that (section E). Do not flip production DNS or README
> production links until `readme-prod-links` and
> `v0-archive-dns-cutover` in
> [`apps/www/lib/roadmap/config.ts`](../apps/www/lib/roadmap/config.ts)
> are done.

---

## Already true / done on v1 (as of writing)

Confirm these still hold on the tip you are about to cut from.

- [x] GitHub milestone **v1**
      ([milestone/1](https://github.com/yamcodes/arkenv/milestone/1))
      has **0 open** / **98 closed** issues.
- [x] Homepage “Works with” ticker
      ([`apps/www/components/page/works-with.tsx`](../apps/www/components/page/works-with.tsx))
      lists ArkType, Zod, Valibot, and hosts - **no Typia**.
- [x] Migration guide exists:
      [`apps/www/content/docs/guides/migrating-to-v1.mdx`](../apps/www/content/docs/guides/migrating-to-v1.mdx).
- [x] CLI library import guard throws in
      [`packages/arkenv/src/index.ts`](../packages/arkenv/src/index.ts)
      (covered by `packages/arkenv/src/smoke.test.ts`).
- [x] `ROADMAP_EXTRAS` already `done: true` in
      [`apps/www/lib/roadmap/config.ts`](../apps/www/lib/roadmap/config.ts):
  - `v0-alpha-banner` - v0 site Alpha banner
  - `cli-postinstall-guard` - CLI import guard for v0 upgrades
- [x] Changesets pre mode is still **alpha**:
      [`.changeset/pre.json`](../.changeset/pre.json) has `"tag": "alpha"`.
- [x] Site release channel default is still **alpha**:
      [`apps/www/lib/config/release.ts`](../apps/www/lib/config/release.ts)
      falls back to `"alpha"` when
      `NEXT_PUBLIC_ARKENV_RELEASE_TAG` / `ARKENV_RELEASE_TAG` are unset.
- [x] Vite startup-validation contract landed via
      [#1840](https://github.com/yamcodes/arkenv/pull/1840) (merged into
      `v1`).

---

## A. Product freeze

Decide what must land before the first RC publish, what parks, and what is
explicitly not an RC gate.

- [ ] Review open PRs into `v1` and mark each **RC blocker** or **park**:
  - [ ] [#1819](https://github.com/yamcodes/arkenv/pull/1819) -
        docs: overhaul TanStack Start guide (open)
  - [ ] [#1807](https://github.com/yamcodes/arkenv/pull/1807) -
        docs(blog): TanStack Start post + author avatars + twoslash
        popovers (draft)
  - [x] [#1840](https://github.com/yamcodes/arkenv/pull/1840) -
        Vite startup validation / plugin contract - **merged**; not an
        open PR anymore
- [ ] Leave
      [#1818](https://github.com/yamcodes/arkenv/issues/1818)
      (TanStack CLI upstream catalog add-on, label `blocked`) **out of
      RC** unless you explicitly promote it. Related Discussion:
      [#1817](https://github.com/yamcodes/arkenv/discussions/1817).
- [ ] Write a short **Not-GA known gaps** list (paste into the RC GitHub
      Release notes or keep under this heading). Candidates to verify,
      not invent:
  - [ ] Upstream TanStack CLI catalog (#1818) still blocked
  - [ ] Perfect completion of every `ROADMAP_EXTRAS` row before first
        `rc` publish (see Explicitly not RC gates)
  - [ ] Any other parked surface from Discussion
        [#1709](https://github.com/yamcodes/arkenv/discussions/1709)
- [ ] Feature freeze after blockers are decided: no new surface area on
      `v1` until the next `rc.n` or GA unless it is a release-blocking
      bugfix.

---

## B. Switch release channel in-repo

Move packages and site copy from alpha to RC without pretending this is
GA. Keep [LAUNCH_RUNBOOK.md](./LAUNCH_RUNBOOK.md) for the eventual
`1.0.0` + empty `RELEASE_TAG` cut.

### Changesets: alpha → rc

Documented in
[CONTRIBUTING.md](./CONTRIBUTING.md) (Use Case 4). Tip today:

```json
{ "mode": "pre", "tag": "alpha" }
```

- [ ] Exit alpha pre mode, then enter rc:

  ```bash
  pnpm changeset pre exit
  pnpm changeset pre enter rc
  ```

- [ ] Confirm [`.changeset/pre.json`](../.changeset/pre.json) shows
      `"tag": "rc"`.
- [ ] Run `pnpm changeset version` (or land the Version Packages PR) so
      publishable packages bump to `1.0.0-rc.n`.

### Publishable packages to bump (from `packages/*` on tip)

Private helpers under `packages/internal/*` are not listed. Tip versions
are still `1.0.0-alpha.*`:

| Package | Path |
| --- | --- |
| `arkenv` | `packages/arkenv` |
| `@arkenv/core` | `packages/core` |
| `@arkenv/standard` | `packages/standard` |
| `@arkenv/nextjs` | `packages/nextjs` |
| `@arkenv/nuxt` | `packages/nuxt` |
| `@arkenv/vite-plugin` | `packages/vite-plugin` |
| `@arkenv/bun-plugin` | `packages/bun-plugin` |
| `@arkenv/rsbuild-plugin` | `packages/rsbuild-plugin` |
| `@arkenv/build` | `packages/build` |
| `@arkenv/fumadocs-ui` | `packages/fumadocs-ui` |
| `@arkenv/agent-plugin` | `packages/agent-plugin` |
| `@arkenv/tanstack-addon` | `packages/tanstack-addon` |

- [ ] Every row above is on `1.0.0-rc.n` (or an intentional independent
      cadence you document in the Release notes).

### Site `RELEASE_TAG`

- [ ] Flip default channel in
      [`apps/www/lib/config/release.ts`](../apps/www/lib/config/release.ts)
      from `"alpha"` → `"rc"`, **or** set
      `NEXT_PUBLIC_ARKENV_RELEASE_TAG=rc` on the v1 / preview deploy.
      Homepage install pills, agent prompt, and MDX `package-install`
      tabs follow this constant (see AGENTS.md / release config JSDoc).

### Hardcoded `@alpha` / alpha copy (does not follow `RELEASE_TAG`)

- [ ] [`README.md`](../README.md) - `npx arkenv@alpha init` and sibling
      package-manager lines
- [ ] [`apps/www/content/docs/guides/migrating-to-v1.mdx`](../apps/www/content/docs/guides/migrating-to-v1.mdx)
      - lead still says packages ship as `1.0.0-alpha.x` under the
      `alpha` npm tag; update for RC
- [ ] [`apps/www/content/docs/reference/agent-plugin.mdx`](../apps/www/content/docs/reference/agent-plugin.mdx)
      - `@arkenv/agent-plugin@alpha` in MCP-only host copy / JSON

### Explicit RC badge / banner on the site

- [ ] Today the hero announcement slot is only
      [`RoadmapProgressCard`](../apps/www/components/page/roadmap-progress-card.tsx)
      on
      [`apps/www/app/(home)/page.tsx`](../apps/www/app/%28home%29/page.tsx)
      - there is **no** Release Candidate badge/banner yet. Add one (or
      extend the announcement chip) so the live site says Release
      Candidate while versions stay `-rc`.

### Flip `ROADMAP_EXTRAS` as items ship

Still `done: false` on tip (do **not** mark these done until the work
lands):

- [ ] `parity-audit` - Final v0 parity audit
- [ ] `readme-prod-links` - Update README links from alpha to production
- [ ] `changelog-epoch` - Prepend changelog epoch warnings
- [ ] `npm-deprecate-cli` - Deprecate `@arkenv/cli` on npm
- [ ] `v0-archive-dns-cutover` - Deploy `v0.arkenv.js.org` archive and
      flip primary DNS
- [ ] `release-v1` - Release v1
- [ ] `v1-announcement` - Document v1 announcement

First RC publish does **not** require every row above. DNS / production
README flips wait on `readme-prod-links` + `v0-archive-dns-cutover`.

---

## C. Publish + install proof

### Dist-tag decision (document both; product path is explicit)

[CONTRIBUTING.md](./CONTRIBUTING.md) describes RC packages publishing to
the **`@rc`** npm dist-tag (`1.0.0-rc.n` under `@rc`) so pre-releases do
not disturb `latest`.

**Chosen product path for ArkEnv RC:** also point npm **`latest`** at
`1.0.0-rc.n` so bare `npx arkenv init` works for newcomers while the
semver version stays `-rc` and the site says Release Candidate. Keep the
`@rc` tag populated as well for callers who pin the channel. GA later
replaces `latest` with `1.0.0` per
[LAUNCH_RUNBOOK.md](./LAUNCH_RUNBOOK.md) §2.

- [ ] Publish `1.0.0-rc.n` for the publishable packages in section B
- [ ] Set dist-tags: `@rc` → `1.0.0-rc.n`, and **`latest` → `1.0.0-rc.n`**
      (product path)
- [ ] Smoke tests after publish:
  - [ ] Bare `npx arkenv init` (exercises `latest`)
  - [ ] `@arkenv/core` + `arktype` in a fresh Node app
  - [ ] `@arkenv/standard` + Zod in a fresh Node app
  - [ ] One framework example (Next.js, Nuxt, Vite, Bun, or Rsbuild)
  - [ ] Confirm `import … from "arkenv"` / `require("arkenv")` still
        throws the CLI import guard

---

## D. Import-guard / migration (product decisions)

- [ ] Hard throw in
      [`packages/arkenv/src/index.ts`](../packages/arkenv/src/index.ts)
      is enough to flip `latest` **if** docs and README stop teaching
      runtime import from `"arkenv"`.
- [ ] Update the guard message to link an **absolute URL** to the
      migrating-to-v1 guide path `/docs/guides/migrating-to-v1` (not the
      homepage). During pre-DNS, build that URL from the same origin
      strategy as `getDocsUrl()` in
      [`apps/www/lib/config/release.ts`](../apps/www/lib/config/release.ts)
      (today’s pre-release fallback is `https://arkenv-v1.vercel.app`)
      so the link does not 404 on the v0 domain `https://arkenv.js.org`.
- [ ] **No migration codemod for RC** - ship guard + migration guide +
      `arkenv init`. Revisit post-RC only if support volume warrants it.
- [ ] `npm deprecate` `@arkenv/cli` when ready
      (`ROADMAP_EXTRAS` id `npm-deprecate-cli`). Wording reference:
      [LAUNCH_RUNBOOK.md](./LAUNCH_RUNBOOK.md) §2.3.

---

## E. Site / GitHub cutover

These overlap GA ops. Prefer executing DNS with the RC announce pack
only when archive + README production links are ready; otherwise keep
serving v1 from `https://arkenv-v1.vercel.app` until then. Full DNS
detail: [LAUNCH_RUNBOOK.md](./LAUNCH_RUNBOOK.md) §3.

- [ ] `arkenv.js.org` → v1 `www`; `v0.arkenv.js.org` archive
- [ ] Optional: default GitHub branch → `v1` (repo default today is
      `dev` - verify before changing)
- [ ] GitHub Release for `1.0.0-rc.n` + announce blog + tweet
- [ ] State the support window for alpha consumers and v0
      (`v0.arkenv.js.org` + last v0 npm lines)

---

## F. GitHub Discussions (required scan)

Walk **open Discussions**, not only Issues/PRs, before cut. Close or
supersede stale RFCs. Do not cut RC with undecided surface area unless
each item is marked won't-do-for-v1 (or parked in Not-GA known gaps).

Open on tip (re-verify):

- [ ] [#1709](https://github.com/yamcodes/arkenv/discussions/1709) -
      Pre-v1 surface area - park or cut decisions
- [ ] [#1750](https://github.com/yamcodes/arkenv/discussions/1750) -
      ESM-only - park vs ship before freeze
- [ ] [#1817](https://github.com/yamcodes/arkenv/discussions/1817) -
      TanStack CLI + Rsbuild - **not** an RC gate unless promoted
      (related issue [#1818](https://github.com/yamcodes/arkenv/issues/1818))
- [ ] [#1798](https://github.com/yamcodes/arkenv/discussions/1798) -
      unplugin vs host plugins - mark resolved if the dedicated
      `@arkenv/rsbuild-plugin` decision shipped (package +
      [`apps/www/content/docs/reference/rsbuild-plugin.mdx`](../apps/www/content/docs/reference/rsbuild-plugin.mdx)
      exist on tip - confirm intent with maintainers)
- [ ] [#1747](https://github.com/yamcodes/arkenv/discussions/1747) -
      TanStack Start strategy - close/supersede if Vite example +
      rsbuild path +
      [`apps/www/content/docs/frameworks/tanstack-start.mdx`](../apps/www/content/docs/frameworks/tanstack-start.mdx)
      are enough
- [ ] Docs feedback
      [#1533](https://github.com/yamcodes/arkenv/discussions/1533)
      through
      [#1575](https://github.com/yamcodes/arkenv/discussions/1575)
      - skim for install/import `"arkenv"` confusion
      (open on tip: 1533, 1534, 1545, 1574, 1575)

### Explicitly NOT RC gates (Discussions)

- [x] [#1688](https://github.com/yamcodes/arkenv/discussions/1688) Studio
- [x] [#1689](https://github.com/yamcodes/arkenv/discussions/1689) flags
- [x] [#1691](https://github.com/yamcodes/arkenv/discussions/1691) eslint
- [x] [#1710](https://github.com/yamcodes/arkenv/discussions/1710) dotenv
      linter

(Checked = agreed out of RC scope; Discussions may stay open.)

---

## Explicitly not RC gates

- TanStack Showcase / upstream catalog showcase work - parked
  ([#1818](https://github.com/yamcodes/arkenv/issues/1818) blocked)
- Essay / Reddit / Habr timing - marketing schedule, not a publish gate
- Perfect completion of every `ROADMAP_EXTRA` before first `rc` publish
- Flipping DNS / README to production before `readme-prod-links` and
  `v0-archive-dns-cutover` are done

---

## Shortest critical path

1. **A** - Freeze: blockers vs park; Not-GA gaps; Discussions scan (F).
2. **B** - Channel flip: changesets `rc`, versions, `RELEASE_TAG`,
   hardcoded alpha copy, RC badge.
3. **C** - Publish `1.0.0-rc.n`, point `latest` + `@rc`, smoke tests.
4. Same-day pack after: import-guard URL polish (D), deprecate
   `@arkenv/cli` when ready, then DNS/announce (E) only if archive +
   production links are ready.

When you are ready for stable `1.0.0`, stop here and follow
[LAUNCH_RUNBOOK.md](./LAUNCH_RUNBOOK.md).
