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

We use a two-branch branching model (`dev` and `main`) to ensure that the production documentation site does not display unreleased features.

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

### Branches

* **`dev`**: The default branch. All development and feature pull requests target `dev`. Merging to `dev` triggers a Vercel Preview deployment (useful for reviewing documentation changes before release).
* **`main`**: The production branch. `main` is *only* updated when a release is actually published. Vercel deploys the production website from `main`.

### Release Lifecycle

1. Merging PRs into `dev` triggers the Changeset Action, which opens/updates a "Version Packages" PR against `dev`.
2. When the "Version Packages" PR is merged into `dev`:
   - Packages are published to npm.
   - The CI workflow automatically fast-forwards `main` to `dev` and pushes it.
   - This push to `main` triggers Vercel to update the production website.

### Syncing Documentation Changes Early

If you make documentation updates (e.g., fixing a typo) and want to push them to production without waiting for the next package release, use one of the following methods:

#### Scenario A: `dev` has no unreleased code
If `dev` is currently clean (meaning there are no unreleased features merged into it):
1. Merge your doc changes into `dev`.
2. Manually trigger the **`deploy-docs`** GitHub Workflow.
3. This workflow verifies that the diff is strictly doc-only, fast-forwards `main` to `dev`, and pushes it to deploy.

#### Scenario B: `dev` has unreleased code
If `dev` already contains unreleased features, you cannot fast-forward `main` directly. Instead, you must run the promotion helper script locally to cherry-pick the fixes:
1. Identify the commit hashes of your doc changes on `dev`.
2. Run the rescue script:
   ```sh
   ./scripts/promote-docs.sh rescue <commit-hash>
   ```
3. Merge the resulting pull request into `main` (this deploys the docs to production).
4. Run the reconciliation script to merge `main` back into `dev` and prevent git history drift:
   ```sh
   ./scripts/promote-docs.sh reconcile
   ```


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
