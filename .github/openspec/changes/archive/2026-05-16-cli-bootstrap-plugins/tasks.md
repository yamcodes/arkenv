## 1. Utilities and Detection

- [ ] 1.1 Introduce or evaluate simple string/AST manipulation utilities in `@arkenv/cli` for safe configuration mutation.
- [ ] 1.2 Implement logic to accurately detect existing framework configuration files (e.g., `vite.config.ts`, `vite.config.js`).

## 2. Vite Plugin Bootstrapping

- [ ] 2.1 Implement Vite config injection logic: inject `import { arkenvPlugin } from '@arkenv/vite-plugin'`.
- [ ] 2.2 Implement Vite config injection logic: securely insert `arkenvPlugin()` into the exported `plugins` array.
- [ ] 2.3 Integrate Vite bootstrapping into the CLI scaffold wizard immediately after dependency installation.

## 3. Bun Plugin Bootstrapping

- [ ] 3.1 Identify standard patterns for Bun configuration/preload setups.
- [ ] 3.2 Implement auto-bootstrapping for recognized Bun structures, or define clear output instructions if mutation is unsafe.
- [ ] 3.3 Integrate Bun bootstrapping/instructions into the CLI scaffold wizard.

## 4. Fallbacks and Verification

- [ ] 4.1 Add robust error handling to gracefully skip mutation and print manual instructions if a config file cannot be safely modified.
- [ ] 4.2 Add unit tests for successful mutations and the fallback behavior.
