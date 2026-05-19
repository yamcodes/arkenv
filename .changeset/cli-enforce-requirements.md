---
"@arkenv/cli": minor
---

#### Enforce technical requirements during `arkenv init`

The CLI now performs early checks for:
- Node.js version >= 18
- TypeScript version >= 5.1
- `strict: true` in `tsconfig.json`
- `moduleResolution` set to `bundler`, `node16`, or `nodenext` in `tsconfig.json`
- Existence of `package.json`

If requirements are not met, the CLI will display a clear error and exit. Users can bypass these checks using the `--force` (or `-f`) flag.
