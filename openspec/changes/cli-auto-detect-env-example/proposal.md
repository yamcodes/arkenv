## Why

The ArkEnv CLI currently allows users to scaffold a schema, but it requires them to manually input keys or start from a blank slate. Many projects already have a `.env.example` file that defines the required environment variables. Automatically detecting this file and suggesting a schema based on its keys significantly reduces friction for new users and improves the onboarding experience.

## What Changes

- **Auto-detection**: The CLI will check for the existence of a `.env.example` file in the current working directory.
- **Prompted Scaffolding**: If `.env.example` is found, the CLI will ask the user if they want to scaffold their ArkEnv schema based on the keys found in that file.
- **Key Extraction**: A robust extractor will parse the `.env.example` file to identify variable names, ignoring values and comments.
- **Schema Generation**: The CLI will generate a starter `env.ts` (or equivalent) with the detected keys mapped to a default validator (e.g., `a.string()`).

## Capabilities

### New Capabilities
- `cli-env-example-detection`: Detects `.env.example` in the project root and extracts environment variable keys.
- `cli-schema-suggestion`: Integrates the detected keys into the scaffolding workflow to suggest a starting schema.

### Modified Capabilities
- (None)

## Impact

- **`@arkenv/cli`**: Updates to the `scaffold` and `prompt` logic.
- **User Experience**: Faster initial setup for projects with existing `.env.example` files.
- **Security**: The tool only reads `.env.example` (not `.env`) to avoid accidental exposure of real secrets during the scaffolding process.
