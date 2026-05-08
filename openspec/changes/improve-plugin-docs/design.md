# Design: Improve Plugin Docs

## Overview

This is a documentation-only change. No package source code or types are modified. All changes are in `apps/www/content/docs/`.

## Vite Plugin Documentation

### Problem Diagnosis

The root issue is a **mismatch between the intro page and the typing page**:

- **Intro page** (`index.mdx`): Shows `arkenv({ PORT: "number.port", VITE_MY_VAR: "string" })` — the schema is passed inline and not exported.
- **Typing page** (`typing-import-meta-env.mdx`): Requires `typeof import("../vite.config").Env` — but `Env` is never exported on the intro page.

A user following the docs in order ends up with:
1. A working dev server (plugin validates envs ✅)
2. But `import.meta.env.VITE_MY_VAR` is not typed (❌) because the `vite-env.d.ts` can't import `Env`.

Additionally, the `vite-env.d.ts` block in the docs is missing:
```ts
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```
Some Vite/TS setups need this for the augmentation to take effect.

### New Flow

The standard setup will be **a single, linear progression**:

1. **Install** (unchanged)
2. **Define your schema as an exported constant** in `vite.config.ts`
3. **Copy the `vite-env.d.ts` snippet** — complete, including `interface ImportMeta`
4. Done — `import.meta.env.VITE_*` is fully typed

"Using ArkEnv in Vite config" (loadEnv) remains a separate page but is clearly marked as the advanced/optional use case.

### File-by-File Changes

#### `content/docs/vite-plugin/index.mdx`

- Lead with a concrete "Quickstart" that covers both validation AND typing in one place
- First code block: show `vite.config.ts` with `export const Env = type({...})` and `arkenv(Env)`
- Second code block: show the complete `src/vite-env.d.ts` snippet right on the intro page as "Step 2"
- Keep the error output block to show the fail-fast benefit
- Keep Standard Schema section (unchanged)
- Keep Installation section (moved to the end)
- Remove the confusing footnote about "some workflows require a dedicated arkenv installation"

#### `content/docs/vite-plugin/typing-import-meta-env.mdx`

- Update the `vite-env.d.ts` snippet to include the `interface ImportMeta` block
- Add a note explaining that the `ImportMeta` interface is required for some Vite/TS setups
- Clarify that `ViteTypeOptions.strictImportMetaEnv` requires Vite ≥ 6.3 and is optional
- The "As your project grows" section stays — it correctly shows the dedicated `src/env.ts` pattern

#### `content/docs/vite-plugin/arkenv-in-viteconfig.mdx`

- Add a clear preamble: "This is an advanced setup for when you need environment variables _inside_ your Vite config itself (e.g., to set `server.port`). Most projects don't need this."
- No other structural changes needed

#### `content/docs/vite-plugin/meta.json`

Reorder pages so typing comes before arkenv-in-viteconfig:
```json
{
  "pages": [
    "---Guide---",
    "index",
    "typing-import-meta-env",
    "arkenv-in-viteconfig"
  ]
}
```

---

## Bun Plugin Documentation

### Problem Diagnosis

The Bun plugin has the same structural issue: the "simple setup" creates an anonymous default export, while the `typing-process-env` page needs to reference it. However, since the bun plugin's simple setup uses `export default type({...})` (not a named constant), the typing page correctly references `typeof import("./src/env").default` — this actually works.

The main issues are:
1. The flow doesn't make it obvious that typing is the "normal" thing to do, not an afterthought
2. The intro page is very long and mixes simple + advanced + Standard Schema all in one page

### File-by-File Changes

#### `content/docs/bun-plugin/index.mdx`

- Add a brief intro paragraph explaining that the standard setup gives you both validation AND typed `process.env`
- After step 1 (schema), add a callout: "See [Typing process.env](/docs/bun-plugin/typing-process-env) to complete the setup"
- Rename "Advanced setup" heading to make the distinction clearer: "Custom schema location"

#### `content/docs/bun-plugin/typing-process-env.mdx`

- No structural changes needed — the snippet is complete
- Add a small note clarifying that this is the recommended step 4 after the intro setup

#### `content/docs/bun-plugin/meta.json`

- No reordering needed — `typing-process-env` already follows `index`

---

## Non-Goals

- No changes to package source code
- No changes to type exports (`ImportMetaEnvAugmented`, `ProcessEnvAugmented`)
- No changes to the `arkenv` core docs or quickstart
- Not adding a third page to either plugin's docs section
