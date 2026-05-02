## 1. Vite Plugin — Introduction Page (`index.mdx`)

- [ ] 1.1 Replace the inline plugin call with `export const Env = type({...})` exported constant pattern
- [ ] 1.2 Add "Step 2" section inline on the intro page showing the complete `src/vite-env.d.ts` snippet (including `interface ImportMeta`)
- [ ] 1.3 Keep error output block and Standard Schema section
- [ ] 1.4 Simplify/remove the confusing installation footnote about "some workflows"

## 2. Vite Plugin — Typing Page (`typing-import-meta-env.mdx`)

- [ ] 2.1 Add `interface ImportMeta { readonly env: ImportMetaEnv; }` to the `vite-env.d.ts` code block
- [ ] 2.2 Add a note explaining when/why `interface ImportMeta` is needed
- [ ] 2.3 Clarify that `ViteTypeOptions.strictImportMetaEnv` is optional and requires Vite ≥ 6.3

## 3. Vite Plugin — Advanced Config Page (`arkenv-in-viteconfig.mdx`)

- [ ] 3.1 Add a clear "advanced/optional" preamble at the top of the page

## 4. Vite Plugin — Sidebar Order (`meta.json`)

- [ ] 4.1 Move `typing-import-meta-env` before `arkenv-in-viteconfig` in the pages array

## 5. Bun Plugin — Introduction Page (`index.mdx`)

- [ ] 5.1 Add a brief intro paragraph clarifying that completing the setup gives you typed `process.env`
- [ ] 5.2 After "Create your schema" step, add a callout pointing to the typing page
- [ ] 5.3 Rename "Advanced setup" heading to "Custom schema location" for clarity

## 6. Bun Plugin — Typing Page (`typing-process-env.mdx`)

- [ ] 6.1 Add a note that this is the recommended completion of the setup from the intro page

## 7. Verification

- [ ] 7.1 Open the docs site locally (`pnpm dev` in `apps/www`) and visually verify the Vite plugin pages
- [ ] 7.2 Verify the Bun plugin pages look correct
- [ ] 7.3 Confirm the sidebar order is correct for both plugins
- [ ] 7.4 Test the `vite-env.d.ts` snippet in the test Vite app to confirm typing works end-to-end
