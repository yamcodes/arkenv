## 1. Preparation and Schema Updates

- [x] 1.1 Update `ProjectOptions` type in `packages/cli/src/prompts.ts` to replace `overwriteEnvDtsFile` with `envDtsHandling: 'overwrite' | 'append' | 'skip'`.
- [x] 1.2 Create `packages/cli/src/utils/injection.ts` and implement the `safeAppend` utility with marker-based duplication check and dynamic path calculation.

## 2. Refactor Prompt Wizard

- [x] 2.1 Update `runPromptWizard` in `packages/cli/src/prompts.ts` to include filesystem checks for both `vite-env.d.ts` and `bun-env.d.ts`.
- [x] 2.2 Refactor `installTypeDefinitions` and `overwriteEnvDtsFile` steps into a single smart branching logic based on file existence for both Vite and Bun frameworks.
- [x] 2.3 Update the "Yes" (default) path in `runPromptWizard` to handle the new schema defaults for both frameworks.

## 3. Update Scaffolding Logic

- [x] 3.1 Refactor `establishTypeDefinitions` in `packages/cli/src/scaffold.ts` to support the new `envDtsHandling` options.
- [x] 3.2 Integrate `safeAppend` utility for the `append` mode implementation.
- [x] 3.3 Ensure the `overwrite` mode maintains current behavior but uses the new schema property.

## 4. Testing and Validation

- [x] 4.1 Update `packages/cli/src/scaffold.test.ts` to include test cases for "file missing" (creation) scenario for both Vite and Bun.
- [x] 4.2 Add test cases to `packages/cli/src/scaffold.test.ts` for "file exists" scenarios (append, overwrite, skip) for both frameworks.
- [x] 4.3 Add unit tests for `safeAppend` utility in `packages/cli/src/utils/injection.test.ts`, covering marker detection, path calculation, and framework templates.
- [x] 4.4 Perform a manual smoke test using the `arkenv-cli` and `bun` playgrounds to verify the interactive flow and headless (agent) mode.
