---
"arkenv": minor
"@arkenv/core": patch
---

Align CLI `--json` output with universal settlement envelopes (ADR 239) and implement `arkenv check`.

- **Structured Settlement Envelopes**: Replaced legacy `{ status, message }` JSON stdout payloads with Prisma 8 compatible `ok`-discriminated settlement documents (`CompletedEnvelope` and `ErroredEnvelope`).
- **Standardized Dotted Taxonomy**: Coded errors and diagnostics use dotted namespaces (`CLI.*` and `ENV.*`).
- **Dynamic Binary Resolution**: Commands in `nextActions` dynamically resolve `{bin}` placeholder into the invoked package runner (e.g. `pnpm arkenv`, `npx arkenv`, `bun x arkenv`).
- **Strict Stream & Error Isolation**: Machine-readable JSON is emitted strictly to `stdout`, keeping human logs on `stderr`. Secret values are deep-redacted across `meta.received`, `summary`, and `why`.
- **`arkenv check` Command**: Added `arkenv check` (with `--file <path>` override) to validate process environment against declared schema, returning exit code `4` with structured diagnostics and `edit-file` nextActions on validation findings, and exit code `2` with `CLI.SCHEMA_NOT_FOUND` when no schema exists.
