---
"@arkenv/nextjs": patch
"@arkenv/cli": patch
---

#### Deprecate Next.js nested layout and add CLI `--flat` flag alias

- Deprecate the legacy nested options overload signature of `createEnv` in `@arkenv/nextjs`.
- Add a one-time development-only runtime warning nudge when the legacy nested layout format is detected.
- Add the `--flat` flag alias to the `@arkenv/cli` (mapping to `--simple`) for Next.js integrations.
- Update the documentation to redirect users from the legacy nested layout to the recommended flat layout.
