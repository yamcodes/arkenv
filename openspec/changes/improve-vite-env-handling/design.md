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

### 2. Smart Prompting Logic
Refactor `runPromptWizard` to perform a filesystem check before the `installTypeDefinitions` and `overwriteEnvDtsFile` steps.
- If file doesn't exist: Prompt with "Establish <file>?" (Yes/No).
- If file exists: Prompt with "Found existing <file>. How should we handle ArkEnv types?" (Append/Overwrite/Skip).
- Supports both `vite-env.d.ts` and `bun-env.d.ts` based on detected framework.

### 3. Safe Injection Utility
Integrate a new `safeAppend` utility into `packages/cli/src/lib/config-mutation.ts`.
- **Approach**: Targeted String Injection. While `magicast` is used for object-based configs like `vite.config.ts`, `.d.ts` files (which rely on triple-slash references and ambient declarations) are better served by a controlled string-based approach to avoid AST-related formatting or reference-stripping issues.
- **Logic**:
  - Read the file content using `fsp.readFile`.
  - Check for framework-specific signatures (e.g., `ImportMetaEnvAugmented` for Vite, `ProcessEnvAugmented` for Bun).
  - If the signature exists, skip injection to avoid duplicates.
  - If missing, append the template content to the end of the file, ensuring it starts on a new line.
  - Write the result using `fsp.writeFile`.

### 4. Refactor `establishTypeDefinitions`
Update the scaffolding logic to honor the `envDtsHandling` option.
- `overwrite`: Same as current behavior (replaces file).
- `append`: Uses `safeAppend` to inject types.
- `skip`: Does nothing.

## Risks / Trade-offs

- **[Risk] Type Merging Conflicts** → Mitigation: `ImportMetaEnv` in TypeScript is an interface and can be declared multiple times (declaration merging). Appending should be safe as long as we don't redefine `ImportMetaEnvAugmented`.
- **[Risk] Path Sensitivity** → Mitigation: Ensure the relative path to `env.ts` in the template is correctly calculated relative to the `vite-env.d.ts` location.
