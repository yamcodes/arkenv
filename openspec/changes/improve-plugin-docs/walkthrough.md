# Walkthrough: Improved Plugin Documentation

I have improved the documentation for both the Vite and Bun plugins to ensure users can easily set up validation and typesafety.

## Vite Plugin Improvements

### 1. Introduction Page (`index.mdx`)
- **Best Practice Pattern**: The "Quickstart" now shows the recommended pattern of exporting the schema as a named `Env` constant in `vite.config.ts`. This fixes the "anonymous schema" issue that broke type augmentation.
- **2-Step Setup**: Added a clear "Step 2" section that shows the complete `src/vite-env.d.ts` snippet directly on the intro page.
- **Simplified Installation**: Merged `arkenv` and `arktype` installation instructions into a single block.

### 2. Typing Page (`typing-import-meta-env.mdx`)
- **Missing Interface**: Added the `interface ImportMeta` block to the `vite-env.d.ts` snippet, which is required for some TypeScript configurations.
- **Clarified Requirements**: Added a note about why `ImportMeta` is needed and clarified that `ViteTypeOptions.strictImportMetaEnv` is an optional feature requiring Vite 6.3+.

### 3. Advanced Config Page (`arkenv-in-viteconfig.mdx`)
- **Preamble**: Added a clear note at the top of the page explaining that this is an **advanced setup** for config variables (like `PORT`), distinguishing it from the standard application usage.

### 4. Sidebar Reorder (`meta.json`)
- Moved "Typing import.meta.env" before "Using ArkEnv in Vite config" to follow the natural setup flow.

---

## Bun Plugin Improvements

### 1. Introduction Page (`index.mdx`)
- **Typed by Default**: Updated the intro to emphasize that a complete setup includes typesafe `process.env`.
- **Callout**: Added a prominent link to the typing guide as part of the "Simple setup".
- **Heading Clarity**: Renamed "Advanced setup" to "Custom schema location" to better describe the use case.

### 2. Typing Page (`typing-process-env.mdx`)
- **Setup Completion**: Added a note clarifying that this guide is the final step of the standard setup.

---

## Verification Results

- ✅ **Vite Setup**: Verified that `export const Env` in `vite.config.ts` combined with the new `vite-env.d.ts` snippet correctly types `import.meta.env.VITE_MY_ENV` in a test app.
- ✅ **Documentation Flow**: The sidebar order now follows the user's setup journey (Intro -> Typing -> Advanced).
- ✅ **Completeness**: All code snippets now include the necessary exports and interface augmentations to prevent "silent failures" in type checking.
