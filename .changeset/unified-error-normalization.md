---
"arkenv": minor
---

#### Refactor error system to use normalized `EnvIssue` and add `safeCreateEnv` API

**BREAKING CHANGE**: Unify validation error formatting across all validation engines (ArkType and Standard Schema). The exact text format of the `message` property on thrown `ArkEnvError` instances has changed. Check and update any test suites or CI/CD pipelines that assert on the exact error message text.

- Implement `EnvIssue` type and attach the full list of errors to `ArkEnvError.issues` for programmatic access.
- Add `safeCreateEnv` API to both `arkenv` and `arkenv/standard` entries for non-throwing validation in Server Actions or Next.js components.
- Standardize Standard Schema validation errors to look and act like ArkType validation errors, resolving received values and flattening paths.
- Redact credentials and sensitive environment variables by default in stringified error reports.
- Support `debugSecrets` configuration and `process.env.ARKENV_DEBUG_SECRETS=true` to temporarily bypass redaction.
