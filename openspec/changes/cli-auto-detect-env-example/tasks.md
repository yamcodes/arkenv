## 1. Key Extraction Logic

- [x] 1.1 Implement `.env.example` parser utility to extract keys using regex.
- [x] 1.2 Add unit tests for the parser utility with various `.env.example` samples (comments, empty values, etc.).

## 2. CLI Prompts Integration

- [x] 2.1 Update `ProjectOptions` type in `prompts.ts` to include an optional `envKeys: string[]`.
- [x] 2.2 Implement `.env.example` detection and prompt logic in `runPromptWizard`.
- [x] 2.3 Ensure the prompt only triggers during a fresh `init` and when `.env.example` exists.

## 3. Template Enhancements

- [x] 3.1 Update `arktypeTemplate` in `templates/arktype.ts` to accept and render dynamic keys.
- [x] 3.2 Update `zodTemplate` in `templates/zod.ts` to accept and render dynamic keys.
- [x] 3.3 Update `valibotTemplate` in `templates/valibot.ts` to accept and render dynamic keys.
- [x] 3.4 Update `getEnvTemplate` in `env-template.ts` to pass `envKeys` to the respective template functions.

## 4. Verification & Testing

- [x] 4.1 Add an integration test in `scaffold.test.ts` verifying that `.env.example` keys are correctly used in the generated file.
- [x] 4.2 Perform a manual smoke test using the compiled CLI against a real `.env.example` file.
