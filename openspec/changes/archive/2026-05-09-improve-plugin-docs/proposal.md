# Change: Improve Plugin Docs

## Why

The current plugin documentation is unclear and leaves users without a working, typesafe `import.meta.env` (for Vite) or `process.env` (for Bun) setup by default. Real-world testing revealed two specific pain points:

1. **Missing `Env` export from `vite.config.ts`**: The Vite plugin's introduction page shows the plugin being used inline (`arkenv({ VITE_MY_VAR: "string" })`) without exporting the schema as a named `Env` constant. The `typing-import-meta-env` page then requires `typeof import("../vite.config").Env`, but there's no `Env` to import — the inline schema is anonymous. Users following the intro then switching to the typing page end up with a broken setup.

2. **`vite-env.d.ts` missing `interface ImportMeta`**: The documented `vite-env.d.ts` block omits the `interface ImportMeta { readonly env: ImportMetaEnv; }` declaration that some Vite setups require for the augmentation to take effect. Users on older Vite versions or certain TypeScript configs can end up with `import.meta.env.VITE_MY_ENV` silently untyped.

3. **Wrong information hierarchy**: Typing `import.meta.env` / `process.env` is the primary value proposition of these plugins, yet it is currently placed _after_ the intro page and framed as a follow-up step. Using envs _in the config itself_ (loading them via `loadEnv`) is the genuinely advanced use case and should be labelled as such.

4. **Bun plugin docs have parallel issues**: The structure and flow mirror the Vite plugin docs, so the same confusions apply there too.

## What Changes

- **Vite plugin — Introduction page**: Rewrite so the very first example exports `Env` as a named constant and passes it to the plugin. The schema should not be inline/anonymous in the intro.
- **Vite plugin — Introduction page**: Integrate a concise "Typing `import.meta.env`" section directly into the intro (or link to it prominently as step 2), making it part of the standard setup, not a footnote.
- **Vite plugin — `typing-import-meta-env` page**: Add the missing `interface ImportMeta` block to the `vite-env.d.ts` example. Add a clear note explaining why it's needed.
- **Vite plugin — `arkenv-in-viteconfig` page**: Rename or relabel to make it clearly "advanced". Move it to the bottom of the sidebar or wrap its content in an `<Callout type="advanced">` / note.
- **Vite plugin — `meta.json`**: Reorder sidebar pages so typing comes before the advanced config page.
- **Bun plugin — Introduction page**: Apply parallel improvements — exported schema constant in the first example, typing `process.env` foregrounded as the standard setup.
- **Bun plugin — `typing-process-env` page**: Verify the code sample is complete and unambiguous.

## Impact

- **Affected docs**: `content/docs/vite-plugin/index.mdx`, `content/docs/vite-plugin/typing-import-meta-env.mdx`, `content/docs/vite-plugin/arkenv-in-viteconfig.mdx`, `content/docs/vite-plugin/meta.json`, `content/docs/bun-plugin/index.mdx`, `content/docs/bun-plugin/typing-process-env.mdx`, `content/docs/bun-plugin/meta.json`
- **No code changes**: This is a documentation-only change. No package source files or types are modified.
- **User-facing**: New users get a working, fully typed setup out of the box without having to read multiple pages and assemble the pieces.

## References

- Vite: [TypeScript for client-side env vars](https://vite.dev/guide/env-and-mode#intellisense-for-typescript)
- Vite: [Strict `ImportMetaEnv`](https://vite.dev/guide/env-and-mode#intellisense-for-typescript) (`ViteTypeOptions.strictImportMetaEnv`)
- Bun: [Environment variables](https://bun.sh/docs/runtime/env)
