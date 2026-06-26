---
"@arkenv/nextjs": patch
"@arkenv/cli": minor
---

#### Deprecate Next.js nested layout and add CLI `--flat` flag

- Deprecate the legacy nested options overload signature of `createEnv` in `@arkenv/nextjs`.
- Add a one-time development-only runtime warning nudge when the legacy nested layout format is detected.
- Add the `--flat` flag to `@arkenv/cli` to scaffold the recommended flat layout for Next.js.
- **BREAKING CHANGE**: Drop support for the `@arkenv/cli` `--simple` flag on Next.js projects; passing it now hard-fails with an error. Run `npx arkenv init` instead (the flat layout is now the default).
- Remove the nested layout choice from the Next.js interactive CLI prompt, defaulting to flat.
- Remove the standalone nested layout documentation page and redirect its URL to the FAQ.
- Update the documentation to guide users from the legacy nested layout to the recommended flat layout.
