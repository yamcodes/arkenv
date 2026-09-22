# Contributing to ArkEnv

Thank you for considering a contribution to ArkEnv! As an open source project, ArkEnv welcomes contributions of all kinds.

## Who can contribute

Human and agent-assisted contributions are equally welcome here. Whether you write every line by hand or lean on an AI agent, you're a first-class contributor, and a human maintainer reviews every pull request before it lands.

To help you find work, triaged issues carry a readiness label:

- **`ready for agent`** - Fully specified and ready for immediate implementation. Pick it up yourself or hand it to an agent; the requirements are clear enough to start coding right away.
- **`ready for human`** - Needs a judgment call or design decision before implementation. These aren't off-limits, they just want a person to weigh in on direction first.

Don't let the label names give you the wrong impression: `ready for agent` simply means "ready to build," not "reserved for bots." Feel free to grab either kind of issue.

## Development setup

1. ### Install Nub

   [Nub](https://nubjs.com/) is the recommended toolchain for this repo. It
   replaces `tsx` / `ts-node` / `tsconfig-paths` / `dotenv`, `pnpm run`,
   `npx` / `pnpm exec`, `pnpm install`, and `nvm` for local work, while
   keeping the existing `pnpm-lock.yaml`. Node is pinned to LTS in
   `.node-version` and provisioned automatically on the next `nub` command.

   ```sh
   curl -fsSL https://nubjs.com/install.sh | bash
   ```

   (Or `npm install -g @nubjs/nub`. See the [Nub docs](https://nubjs.com/docs).)

2. ### Clone the repository

   ```sh
   git clone https://github.com/yamcodes/arkenv.git
   cd arkenv
   ```

3. ### Install dependencies

   ```sh
   nub install
   ```

4. ### Run the docs site

   ```sh
   nub run www
   ```

   This starts a single `next dev` server at
   [http://localhost:3000](http://localhost:3000).

## Making changes

1. Fork the repository and create your branch from `dev`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Update the documentation if needed. The root `README.md` is a symlink
   to `packages/core/README.md` (so GitHub and the npm package page stay
   in sync). Edit `packages/core/README.md` when changing the README —
   GitHub's blob **Edit** on the root path overwrites the symlink with a
   copy and reintroduces drift.
5. Create a changeset for your changes:
   ```sh
   nub run changeset
   ```
   This will prompt you to:
   - Select which packages you want to release
   - Choose the type of version bump (major/minor/patch)
   - Provide a summary of the changes
6. Commit the generated changeset file along with your changes
7. Issue that pull request!

## Commit & PR title style

We **do not use Conventional Commits** (`feat:`, `fix:`, `chore:`, etc.). Instead, we write commit messages and PR titles in plain **sentence-case imperative style**:

- Start with a capital letter
- Use the imperative mood ("Add", "Fix", "Update", not "Added" or "Adds")
- Keep the rest of the message in normal sentence case (not ALL CAPS or Title Case)
- No trailing period

**Examples:**

```
✅ Add support for custom error messages
✅ Fix type inference for optional variables
✅ Update README with Bun integration example

❌ feat: add support for custom error messages
❌ added support for custom error messages
❌ Add Support For Custom Error Messages
```

## Branching & Release Workflow

We use a **Dual-Branch Model** (`dev` and `main`) to ensure the production documentation site is strictly synchronized with npm releases, meaning it never displays unreleased features. For the architectural reasoning behind this decision, see [ADR 0006: Branching and Release Flow](./adr/0006-branching-and-release-flow.md).

```
                  ┌───────────────┐
                  │  Feature PRs  │
                  └───────┬───────┘
                          ▼
                    ┌───────────┐
                    │    dev    │ (Default branch / Previews)
                    └─────┬─────┘
                          │ (Changeset version PR merged & published)
                          ▼
                    ┌───────────┐
                    │   main    │ (v0 docs archive → arkenv-v0.vercel.app)
                    └───────────┘
```

> **RC docs cutover (Option A):** Production / `arkenv.js.org` tracks
> **`v1`** (`vercel --prod`). Pushes to **`main`** refresh the legacy
> archive at `https://arkenv-v0.vercel.app` and must **not** take
> Production. `https://arkenv-dev.vercel.app` and
> `https://arkenv-v1.vercel.app` stay as stable aliases. At GA (Option B,
> later), rename so the v1 line becomes `main`/`dev` and the old line
> becomes `v0` — out of scope for the RC Actions retarget.

### Key Workflows

#### Use Case 1: Developing a New Feature

When adding functionality or new documentation pages for unreleased code:

1. Create a feature branch off `dev`.
2. Commit your code and run `nub run changeset` to generate a version bump file.
3. Open a Pull Request targeting `dev`.
4. Merging to `dev` will deploy a Vercel Preview (for review), but it will **not** affect the production documentation site.

#### Use Case 2: Releasing Packages to npm

When you are ready to publish the unreleased features currently sitting on `dev`:

1. Navigate to the automatically generated "Version Packages" PR (created by Changesets) targeting `dev`.
2. Review the aggregated `CHANGELOG.md` and version bumps.
3. Merge the "Version Packages" PR into `dev`.
4. A GitHub workflow will automatically build and publish the packages to npm.
5. Immediately after a successful publish, the workflow automatically fast-forwards the `main` branch to match `dev`. This push to `main` refreshes the **v0 docs archive** (`https://arkenv-v0.vercel.app`), not Production. Production / `arkenv.js.org` tracks **`v1`**.

#### Use Case 3: Fixing a Typo on the Live Docs

When you need to fix a typo or make a cosmetic change to the **live v1**
documentation *without* waiting on a package release:

1. Open a PR against **`v1`** (the branch that owns Production /
   `arkenv.js.org`). Merging (or pushing) updates apex via
   `deploy-www.yml`.
2. For **legacy v0 archive** fixes only (`arkenv-v0.vercel.app`), use
   the `sync-main` skill / `main` branch as before — that path no longer
   flips Production.

#### Use Case 4: Coordinating a Major Version (e.g., v1)

When working on a massive marketing push, docs facelift, or breaking API changes that will take weeks or months to coordinate:

1. **Create a long-lived branch:** Branch off `dev` and name it `next` or `v1`.
2. **Develop in parallel:** Merge all breaking code and marketing doc updates into `v1`. Meanwhile, you can continue merging normal bug fixes and minor features into `dev` and releasing them to `main` as usual.
3. **Immediate forward-porting (dual-tracking) to prevent drift:** `v1`
   renamed packages (`packages/cli` is now `packages/arkenv`; the old
   `arkenv` runtime lives in `packages/core` as `@arkenv/core`). A naive
   git merge of `dev`/`main` into `v1` causes severe tree conflicts. Use
   a feature-driven forward-port instead:

   - **Develop against `dev` (v0):** Land new features and bugfixes on
     `dev` first unless they are `v1`-only.
   - **Port by re-applying the PR diff:** After a change merges to
     `dev`, re-apply it on `v1` (cherry-pick or manual patch). Adapt
     paths and APIs. Do not merge `main` into `v1`.
   - **Translate changeset package names:** Copy the changeset onto `v1`
     and rewrite the YAML frontmatter to match this branch:
     - `@arkenv/cli` (v0) ➔ `arkenv` (v1 CLI)
     - `arkenv` (v0 runtime) ➔ `@arkenv/core` (v1 runtime)
4. **Previews & Pre-releases (`alpha` ➔ `beta` ➔ `rc`):** Vercel will automatically deploy the `v1` branch as a Preview environment. To safely publish pre-release npm packages from this branch without affecting the `latest` npm tag, initialize Changesets pre-release mode by specifying the phase:

   - **Alpha** (Initial unstable integration): `nubx changeset pre enter alpha` (produces `1.0.0-alpha.0`, `1.0.0-alpha.1`, etc. published to `@alpha`)
   - **Beta** (Feature complete, testing needed): `nubx changeset pre enter beta` (produces `1.0.0-beta.0`, `1.0.0-beta.1`, etc. published to `@beta`)
   - **Release Candidate** (API frozen, final validation): `nubx changeset pre enter rc` (produces `1.0.0-rc.0`, `1.0.0-rc.1`, etc. published to `@rc`). Maintainer cut checklist (including the product decision to also point `latest` at `1.0.0-rc.n`): [RC_CHECKLIST.md](./RC_CHECKLIST.md). While pre tag is `rc`, the release workflow also points npm `latest` at each just-published version. That retag uses the `NPM_TOKEN` secret (granular **stage-only** token for dist-tags; publish stays on OIDC — the npm CLI has no OIDC exchange for `dist-tag`). If CI auth is unavailable, retag locally with `pnpm point-latest-at-rc -- --otp <code>` after `npm login` (or `NPM_CONFIG_OTP=<code> pnpm point-latest-at-rc`; see [RC_CHECKLIST.md](./RC_CHECKLIST.md) §C and [skills/point-latest-at-rc/SKILL.md](../skills/point-latest-at-rc/SKILL.md)). Retag stops after `changeset pre exit` (sets `pre.json` mode to `"exit"`; the file is deleted later by `changeset version`).

   > [!IMPORTANT]
   > **SemVer Pre-release Identifiers vs Build Metadata**:
   > Always use dot-separated pre-release identifiers (e.g., `1.0.0-alpha.0`, `1.0.0-alpha.1`) to track sequential builds. Do NOT use build metadata with a plus sign (e.g., `1.0.0-alpha.0+build.1`), because the SemVer specification and npm ignore build metadata when determining version precedence. Npm will not allow publishing multiple packages with versions that differ only by build metadata.
5. **The Big Release:** When Launch Day arrives, merge `v1` into `dev`. Then, run `nubx changeset pre exit` to graduate from the pre-release phase to stable. The standard **Use Case 2** workflow takes over, producing a final "Version Packages" PR that publishes `1.0.0` to the `latest` tag and fast-forwards `main`.

## Preview deployments

PR previews for the `www` app are opt-in. A maintainer (triage+) applies the `preview` label to trigger a Vercel preview deployment when the label is added, and again on subsequent `synchronize` / `ready_for_review` events while the label remains (a preview is only produced when the `www` app is actually affected). This works for same-repo and fork PRs; fork authors cannot self-serve the label.

Stable www URLs (GitHub Actions + Vercel CLI, not native Vercel Git builds):

| Branch / action                | Target                                                                              |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| Push to **`v1`**               | Production (`arkenv.js.org`) via `--prod`, and alias `https://arkenv-v1.vercel.app` |
| Push to **`main`**             | Archive alias `https://arkenv-v0.vercel.app` (preview deploy, **not** `--prod`)     |
| Push to **`dev`** (if present) | Alias `https://arkenv-dev.vercel.app`                                               |
| Labeled PR                     | Ephemeral preview URL only (does not take over the aliases above)                   |

To redeploy an older commit to a stable URL without moving the branch, maintainers can run **Actions → Deploy www (manual SHA)** and choose `arkenv-dev.vercel.app`, `arkenv-v0.vercel.app`, `arkenv-v1.vercel.app`, or production `arkenv.js.org`.

**Phased cutover:** RC keeps these branch names (**Option A**). At GA
(**Option B**, later), rename so the v1 line becomes `main`/`dev` and
the old line becomes **`v0`**, then leave `--prod` on `main` again. See
[LAUNCH_RUNBOOK.md](./LAUNCH_RUNBOOK.md) §3.1.

## Changesets

[Changesets](https://github.com/changesets/changesets) is used to manage versions and changelogs. Each PR that makes changes to the functionality of the package should include a changeset.

To create a changeset:

1. Run `nub run changeset`
2. Follow the prompts to describe your changes
3. Commit the generated `.changeset/*.md` file

The changeset will be automatically used to bump versions and update the changelog when your PR is merged.

## All contributors

We use the [All Contributors](https://allcontributors.org/) specification to recognize all contributions.

If you've contributed to the project, please add yourself! We have a bot setup to make this easy. You can comment on your Pull Request or Issue with:

`@all-contributors please add @<your-username> for <contributions>`

For example:

`@all-contributors please add @yamcodes for code, doc`

For a full list of contribution types and more details on how to use the bot, please refer to the [bot usage documentation](https://allcontributors.org/bot/usage).

## License

By contributing your code to the ArkEnv GitHub repository, you agree to
license your contributions under the MIT License, except for `apps/dash`,
which is AGPL-3.0-or-later because it depends on Dashfy.
