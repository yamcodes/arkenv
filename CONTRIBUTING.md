# Contributing to ArkEnv

Thank you for considering a contribution to ArkEnv! As an open source project, ArkEnv welcomes contributions of all kinds.


## Development Setup

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

## Making Changes

1. Fork the repository and create your branch from `main`
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

## Changesets

[Changesets](https://github.com/changesets/changesets) is used to manage versions and changelogs. Each PR that makes changes to the functionality of the package should include a changeset.

To create a changeset:
1. Run `pnpm changeset`
2. Follow the prompts to describe your changes
3. Commit the generated `.changeset/*.md` file

The changeset will be automatically used to bump versions and update the changelog when your PR is merged.

## All Contributors

We use the [All Contributors](https://allcontributors.org/) specification to recognize all contributions.

If you've contributed to the project, please add yourself! We have a bot setup to make this easy. You can comment on your Pull Request or Issue with:

`@all-contributors please add @<your-username> for <contributions>`

For example:

`@all-contributors please add @yamcodes for code, doc`

For a full list of contribution types and more details on how to use the bot, please refer to the [bot usage documentation](https://allcontributors.org/bot/usage).

## License

By contributing your code to the ArkEnv GitHub repository, you agree to license your contributions under the MIT License.