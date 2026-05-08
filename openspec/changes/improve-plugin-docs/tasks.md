## 1. Vite Plugin — Introduction Page (`index.mdx`)

- [x] 1.1 Replace the inline plugin call with `export const Env = type({...})` exported constant pattern
- [x] 1.2 Add "Step 2" section inline on the intro page showing the complete `src/vite-env.d.ts` snippet (including `interface ImportMeta`)
- [x] 1.3 Keep error output block and Standard Schema section
- [x] 1.4 Move Installation section to the top of Quickstart

## 2. Vite Plugin — Typing Page (`typing-import-meta-env.mdx`)

- [x] 2.1 Add `interface ImportMeta { readonly env: ImportMetaEnv; }` to the `vite-env.d.ts` code block
- [x] 2.2 Add a note explaining when/why `interface ImportMeta` is needed
- [x] 2.3 Clarify that `ViteTypeOptions.strictImportMetaEnv` is optional and requires Vite ≥ 6.3

## 3. Vite Plugin — Advanced Config Page (`arkenv-in-viteconfig.mdx`)

- [x] 3.1 Add a clear "advanced/optional" preamble at the top of the page

## 4. Vite Plugin — Sidebar Order (`meta.json`)

- [x] 4.1 Move `typing-import-meta-env` before `arkenv-in-viteconfig` in the pages array

## 5. Bun Plugin — Introduction Page (`index.mdx`)

- [x] 5.1 Add a brief intro paragraph clarifying that completing the setup gives you typed `process.env`
- [x] 5.2 After "Create your schema" step, add a callout pointing to the typing page
- [x] 5.3 Rename "Advanced setup" heading to "Custom schema location" for clarity
- [x] 5.4 Move Installation section to the top of Usage

## 6. Bun Plugin — Typing Page (`typing-process-env.mdx`)

- [x] 6.1 Add a note that this is the recommended completion of the setup from the intro page

## 7. Playgrounds

- [x] 7.1 Update `apps/playgrounds/vite/src/vite-env.d.ts` to include `interface ImportMeta` block
- [x] 7.2 Update `apps/playgrounds/vite-legacy/src/vite-env.d.ts` (if it exists) to match

## 8. Verification

- [ ] 8.1 Open the docs site locally (`pnpm dev` in `apps/www`) and visually verify the Vite plugin pages
- [ ] 8.2 Verify the Bun plugin pages look correct
- [ ] 8.3 Confirm the sidebar order is correct for both plugins
- [ ] 8.4 Test the `vite-env.d.ts` snippet in the test Vite app to confirm typing works end-to-end
