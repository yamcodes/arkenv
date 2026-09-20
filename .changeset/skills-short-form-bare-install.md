---
"arkenv": patch
"@arkenv/agent-plugin": patch
---

#### Advertise short `skills add` and bare install commands

With `v1` as the GitHub default branch (merge only after product `latest` → RC and the apex docs cutover):

- `arkenv init` and docs always use `npx skills add yamcodes/arkenv` (no `/tree/v1` URL)
- Hero / docs install CTAs use bare `npx arkenv init` / `pnpm add @arkenv/*` via `INSTALL_TAG` (no `@rc` / `@alpha` tags); the Release Candidate badge stays on `RELEASE_TAG`
- `getDocsUrl()` accepts `arkenv.js.org` during RC so apex can serve the v1 site
