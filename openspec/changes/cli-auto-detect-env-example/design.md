## Context

The ArkEnv CLI (`@arkenv/cli`) facilitates the scaffolding of type-safe environment variable schemas. Currently, it provides a static template with `NODE_ENV` and `PORT`. This design aims to enhance the onboarding experience by detecting and parsing `.env.example` files to pre-populate the schema with relevant keys.

## Goals / Non-Goals

**Goals:**
- Detect `.env.example` in the project root during the `arkenv init` (scaffold) process.
- Robustly parse `.env.example` to extract variable keys while ignoring comments and values.
- Prompt the user to use the detected keys for scaffolding.
- Update templates (`arktype`, `zod`, `valibot`) to accept and render dynamic keys.

**Non-Goals:**
- Detecting or reading `.env` files (for security).
- Attempting to infer types from `.env.example` values (defaulting to strings is safer and simpler).
- Automatic updates of existing ArkEnv configurations (only for new scaffolds).

## Decisions

### 1. Key Extraction Logic
**Decision:** Use a regex-based parser to identify keys in `.env.example`.
**Rationale:** Standard `.env` formats are typically `KEY=VALUE` or just `KEY=`. A simple regex `^[A-Z_][A-Z0-9_]*` (after trimming) can capture most valid environment variable names.
**Alternatives:** Using a full `.env` parser library. *Rejected* to keep CLI dependencies minimal and because we only need keys, not values.

### 2. Integration Point
**Decision:** Add the detection logic to `runPromptWizard` in `prompts.ts`.
**Rationale:** This keeps the scaffolding logic in `scaffold.ts` clean and allows the wizard to pass the extracted keys as part of the `ProjectOptions`.

### 3. Template Modification
**Decision:** Update template functions to accept an optional `envKeys: string[]` array.
**Rationale:** If `envKeys` are provided, the template will iterate over them to generate the schema. If not, it will fall back to the default `NODE_ENV` and `PORT`.

## Risks / Trade-offs

- **[Risk]** Parsing non-standard `.env.example` formats. → **Mitigation:** Use a conservative regex and provide a fallback to the default template if extraction fails or returns no keys.
- **[Risk]** Large `.env.example` files generating huge schemas. → **Mitigation:** The user is prompted before this happens, giving them an opportunity to decline.
