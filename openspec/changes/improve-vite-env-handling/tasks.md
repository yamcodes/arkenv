## 1. Preparation and Schema Updates

- [ ] 1.1 Update `ProjectOptions` type in `packages/cli/src/prompts.ts` to replace `overwriteEnvDtsFile` with `envDtsHandling: 'overwrite' | 'append' | 'skip'`.
- [ ] 1.2 Create `packages/cli/src/lib/fs-utils.ts` and implement the `safeAppend` utility with duplication check.

## 2. Refactor Prompt Wizard

- [ ] 2.1 Update `runPromptWizard` in `packages/cli/src/prompts.ts` to include filesystem checks for both `vite-env.d.ts` and `bun-env.d.ts`.
- [ ] 2.2 Refactor `installTypeDefinitions` and `overwriteEnvDtsFile` steps into a single smart branching logic based on file existence for both Vite and Bun frameworks.
- [ ] 2.3 Update the "Yes" (default) path in `runPromptWizard` to handle the new schema defaults for both frameworks.

## 3. Update Scaffolding Logic

- [ ] 3.1 Refactor `establishTypeDefinitions` in `packages/cli/src/scaffold.ts` to support the new `envDtsHandling` options.
- [ ] 3.2 Integrate `safeAppend` utility for the `append` mode implementation.
- [ ] 3.3 Ensure the `overwrite` mode maintains current behavior but uses the new schema property.

## 4. Testing and Validation

- [ ] 4.1 Update `packages/cli/src/scaffold.test.ts` to include test cases for "file missing" (creation) scenario for both Vite and Bun.
- [ ] 4.2 Add test cases to `packages/cli/src/scaffold.test.ts` for "file exists" scenarios (append, overwrite, skip) for both frameworks.
- [ ] 4.3 Add unit tests for `safeAppend` utility in a new `packages/cli/src/lib/fs-utils.test.ts` file, covering both Vite and Bun signatures.
- [ ] 4.4 Perform a manual smoke test using the `arkenv-cli` and `bun` playgrounds to verify the interactive flow.
