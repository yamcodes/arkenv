## Context

The `@arkenv/cli` currently uses a simple overwrite confirmation for `vite-env.d.ts` and `bun-env.d.ts`. This is destructive and forces users to manually merge changes if they want to keep existing type definitions (like `vite/client`).

## Goals / Non-Goals

**Goals:**
- Provide a non-destructive way to add ArkEnv types to existing environment type files.
- Improve CLI UX by detecting existing files before prompting.
- Avoid duplicate injections if the CLI is run multiple times.

**Non-Goals:**
- Complex AST-based merging. Simple string-based appending is sufficient for declaration files.
- Automatic removal of ArkEnv types.

## Decisions

### 1. Update ProjectOptions Schema
Modify `ProjectOptions` to support a more granular handling of type files.
- **Current**: `overwriteEnvDtsFile?: boolean`
- **New**: `envDtsHandling?: 'overwrite' | 'append' | 'skip'`
- **Headless Default**: When `isYes` or `isAgent` is true, `envDtsHandling` will default to `append` if the file exists, and `overwrite` (effectively create) if it doesn't. This ensures non-destructive behavior for AI assistants.

### 2. Smart Prompting Logic
Refactor `runPromptWizard` to perform a filesystem check before the `installTypeDefinitions` and `overwriteEnvDtsFile` steps.
- If file doesn't exist: Prompt with "Establish <file>?" (Yes/No).
- If file exists: Prompt with "Found existing <file>. How should we handle ArkEnv types?" (Append/Overwrite/Skip).
- Supports both `vite-env.d.ts` and `bun-env.d.ts` based on detected framework.

### 3. Safe Injection Utility
Create a new utility at `packages/cli/src/utils/injection.ts`.
- **Robust Duplication Check**: Use a comment marker `// @arkenv-types` injected at the top of the appended block. Checking for this specific marker avoids fragility related to user formatting (spaces/tabs/line-endings).
- **Dynamic Path Calculation**: Use `path.relative` from the `.d.ts` file's directory to the schema file's directory. 
  - Example: `path.relative(path.dirname(dtsPath), schemaPath)`.
  - Ensure the resulting path starts with `./` and strip the `.ts` extension for a valid TypeScript import.
- **Logic**:
  - Read the file content using `fsp.readFile`.
  - Check for the `// @arkenv-types` marker.
  - If the marker exists, skip injection.
  - If missing, calculate the relative import path, generate the template, and append it to the end of the file.
  - Ensure the injection starts on a new line and follows existing line-ending conventions if possible (or default to `\n`).

### 4. Refactor `establishTypeDefinitions`
Update the scaffolding logic to honor the `envDtsHandling` option.
- `overwrite`: Same as current behavior (replaces file).
- `append`: Uses `safeAppend` to inject types.
- `skip`: Does nothing.

## Risks / Trade-offs

- **[Risk] Type Merging Conflicts** → Mitigation: `ImportMetaEnv` in TypeScript is an interface and can be declared multiple times (declaration merging). Appending should be safe as long as we don't redefine `ImportMetaEnvAugmented`.
- **[Risk] Path Sensitivity** → Mitigation: Ensure the relative path to `env.ts` in the template is correctly calculated relative to the `vite-env.d.ts` location.
