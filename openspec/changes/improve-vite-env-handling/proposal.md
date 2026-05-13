## Why

Currently, the `@arkenv/cli` has a frustrating UX when handling the `vite-env.d.ts` file. It asks a hypothetical question ("Establish vite-env.d.ts?"), and if the user says yes but the file already exists, it hits them with a destructive overwrite warning. This forces developers to manually check their filesystem and can lead to accidental deletion of default Vite configurations.

## What Changes

- **Smart Detection**: The CLI will check for the existence of `vite-env.d.ts` before prompting the user.
- **Conditional Prompting**: The prompt text will change based on whether the file exists.
- **Safe Injection (Append Mode)**: When the file exists, the user will be offered an "Append types safely" option that adds ArkEnv types without destroying existing content.
- **Improved UX**: Users are no longer asked to "Establish" a file that already exists, and the default action becomes non-destructive.

## Capabilities

### New Capabilities
- `safe-injection`: Capability to safely inject type references or declarations into existing files without overwriting the entire file.

### Modified Capabilities
- `scaffolding-cli`: Update overwrite handling requirements to support smart detection and append mode for environment type files.

## Impact

- `@arkenv/cli`: Main entry point and scaffolding logic will be refactored to include filesystem checks and conditional prompts.
- Test suite: New test cases for "file exists" and "file missing" scenarios in the scaffolding workflow.
