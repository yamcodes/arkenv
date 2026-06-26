---
"@arkenv/nextjs": patch
"@arkenv/cli": patch
---

#### Deprecate Next.js nested layout and add CLI `--flat` flag

- Deprecate the legacy nested options overload signature of `createEnv` in `@arkenv/nextjs`.
- Add a one-time development-only runtime warning nudge when the legacy nested layout format is detected.
- Add the `--flat` flag to `@arkenv/cli` to scaffold the recommended flat layout for Next.js.
- Deprecate the `--simple` CLI flag: passing it on a Next.js project now hard-fails with an error.
- Remove the nested layout choice from the Next.js interactive CLI prompt, defaulting to flat.
- Update the documentation to redirect users from the legacy nested layout to the recommended flat layout.
