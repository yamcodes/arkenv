# Contributing to ArkEnv

Thank you for considering a contribution to ArkEnv! As an open source project, ArkEnv welcomes contributions of all kinds.

## Development setup

1. ### Install pnpm

   ```sh
   curl -fsSL https://get.pnpm.io/install.sh | sh -
   ```

   (Or follow the instructions in the [pnpm docs](https://pnpm.io/installation))

2. ### Clone the repository

   ```sh
   git clone https://github.com/yamcodes/arkenv.git
   cd arkenv
   ```

3. ### Install dependencies

   ```sh
   pnpm install
   ```

## Making changes

1. Fork the repository and create your branch from `dev`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Update the documentation if needed
5. Create a changeset for your changes:
   ```sh
   pnpm changeset
   ```
   This will prompt you to:
   - Select which packages you want to release
   - Choose the type of version bump (major/minor/patch)
   - Provide a summary of the changes
6. Commit the generated changeset file along with your changes
7. Issue that pull request!

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
                    │   main    │ (Production docs / Vercel prod)
                    └───────────┘
```

### Key Workflows

#### Use Case 1: Developing a New Feature

When adding functionality or new documentation pages for unreleased code:

1. Create a feature branch off `dev`.
2. Commit your code and run `pnpm changeset` to generate a version bump file.
3. Open a Pull Request targeting `dev`.
4. Merging to `dev` will deploy a Vercel Preview (for review), but it will **not** affect the production documentation site.

#### Use Case 2: Releasing Packages to npm

When you are ready to publish the unreleased features currently sitting on `dev`:

1. Navigate to the automatically generated "Version Packages" PR (created by Changesets) targeting `dev`.
2. Review the aggregated `CHANGELOG.md` and version bumps.
3. Merge the "Version Packages" PR into `dev`.
4. A GitHub workflow will automatically build and publish the packages to npm.
5. Immediately after a successful publish, the workflow automatically fast-forwards the `main` branch to match `dev`. This push to `main` triggers the production documentation deploy.

#### Use Case 3: Fixing a Typo on the Live Docs

When you need to fix a typo or make a cosmetic change to the live documentation *without* publishing a new npm package:

1. Do not use the standard `dev` feature workflow (otherwise your typo fix will be trapped in `dev` until the next npm release).
2. Ask your AI Agent to invoke the `/sync-main` slash command, or manually run the `sync-main` skill.
3. **If `dev` is clean** (no unreleased features): Merge your doc fix to `dev`, then run the `Sync main` GitHub workflow to fast-forward `main`.
4. **If `dev` has unreleased features**: Use the script locally to cherry-pick your fix:
   ```sh
   ./scripts/sync-main.sh rescue <commit-hash>
   ./scripts/sync-main.sh reconcile
   ```
   This ensures the fix hits `main` instantly while preventing Git history drift.

## Deployment rate limiter

To manage Vercel resource usage, we implement a soft rate limiter for preview deployments:

- **Daily Limit**: 72 preview deployments per 24 hours.
- **Cooldown**: 20 minutes between deployments on the same PR.

If the limit or cooldown is reached, the deployment step in the GitHub Action will be skipped. This is a "soft" limit - it doesn't fail the build, it just pauses deployments. Production deployments are not gated but will trigger an alert if frequency exceeds 24/day.

## Changesets

[Changesets](https://github.com/changesets/changesets) is used to manage versions and changelogs. Each PR that makes changes to the functionality of the package should include a changeset.

To create a changeset:

1. Run `pnpm changeset`
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

By contributing your code to the ArkEnv GitHub repository, you agree to license your contributions under the MIT License.
