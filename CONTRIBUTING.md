# Contributing to `ark.env`

First off, thank you for considering a contribution to `ark.env`! As an open source project, `ark.env` welcomes contributions of all kinds.

> [!IMPORTANT]
> `ark.env` is built with [Bun](https://bun.sh). To develop on this project, you'll need [to have Bun installed](https://bun.sh/docs/installation).

## Development Setup

```sh
# Clone the repository
git clone https://github.com/yamcodes/ark.env.git
cd ark.env

# Install dependencies
bun install

# Run tests
bun test

# Build the library
bun run build
```

## Making Changes

1. Fork the repository and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Update the documentation if needed
5. Create a changeset for your changes:
   ```sh
   bun changeset
   ```
   This will prompt you to:
   - Select which packages you want to release
   - Choose the type of version bump (major/minor/patch)
   - Provide a summary of the changes
6. Commit the generated changeset file along with your changes
7. Issue that pull request!

## Changesets

We use [Changesets](https://github.com/changesets/changesets) to manage versions and changelogs. Each PR that makes changes to the functionality of the package should include a changeset.

To create a changeset:
1. Run `bun changeset`
2. Follow the prompts to describe your changes
3. Commit the generated `.changeset/*.md` file

The changeset will be automatically used to bump versions and update the changelog when your PR is merged.

## License

By contributing your code to the `ark.env` GitHub repository, you agree to license your contributions under the MIT License.