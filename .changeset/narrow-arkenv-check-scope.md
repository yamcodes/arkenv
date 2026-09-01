---
"arkenv": patch
---

#### Narrow `arkenv check` mandate to runtime schema validation

- Lock `arkenv check` mandate strictly to validating runtime environment variables (`process.env` + overlays) against the project schema, and clarify that it does not perform AST formatting or syntax lint diagnostics.
- Update ADR 0017 to Superseded in favor of focused runtime validation.
