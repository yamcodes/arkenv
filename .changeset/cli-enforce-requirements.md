---
"@arkenv/cli": minor
---

#### Enforce technical requirements during `arkenv init`

**BREAKING CHANGE**: The CLI now performs early checks for technical requirements and will exit with an error if they are not met.

The following requirements are now enforced:
- Node.js version >= 22
- TypeScript version >= 5.1
- `strict: true` in `tsconfig.json`
- `moduleResolution` set to `bundler`, `node16`, or `nodenext` in `tsconfig.json`
- Existence of `package.json`

**Migration**: Ensure your environment and configuration meet these requirements before running `arkenv init`. If you need to bypass these checks, or force scaffolding in a non-empty directory, use the `--force` (or `-f`) flag.
