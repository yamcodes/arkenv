# @arkenv/cli

## 0.0.3

### Patch Changes

- #### Improve CLI UI and fix installation output _[`#904`](https://github.com/yamcodes/arkenv/pull/904) [`ef17a38`](https://github.com/yamcodes/arkenv/commit/ef17a38983aac4a167883f6855e22fecfc797ee2) [@yamcodes](https://github.com/yamcodes)_

  - Display CLI version on the help page and at startup
  - Fix "doubling up" of terminal output during dependency installation by piping process output
  - Resolve Node.js DEP0190 deprecation warning in scaffolding logic

- #### Auto-detect `.env.example` keys during init and suggest schema _[`#904`](https://github.com/yamcodes/arkenv/pull/904) [`ef17a38`](https://github.com/yamcodes/arkenv/commit/ef17a38983aac4a167883f6855e22fecfc797ee2) [@yamcodes](https://github.com/yamcodes)_

  - Robust parsing of `.env.example` to extract variable keys
  - Integration with the `init` wizard to suggest keys for scaffolding
  - Minimal scaffolding templates without introductory comments or platform notes
  - Simplified CLI output with live dependency installation progress
  - Updated CLI documentation and added post-scaffold guidance to refine types

## 0.0.2

### Patch Changes

- #### Ctrl+C now quits the CLI _[`0781031`](https://github.com/yamcodes/arkenv/commit/07810318a75f74d9c57b90f665ef1e5b2117b5fc) [@yamcodes](https://github.com/yamcodes)_
- #### Detect existing setups _[`0781031`](https://github.com/yamcodes/arkenv/commit/07810318a75f74d9c57b90f665ef1e5b2117b5fc) [@yamcodes](https://github.com/yamcodes)_

  The CLI now checks for an existing ArkEnv setup and offers to abort or override accordingly.

## 0.0.1

### Patch Changes

- #### ArkEnv CLI _[`#897`](https://github.com/yamcodes/arkenv/pull/897) [`bd77362`](https://github.com/yamcodes/arkenv/commit/bd773620ed4b3391deb311e9efd2a5284cb30b4a) [@yamcodes](https://github.com/yamcodes)_

  Introducing the `@arkenv/cli` tool to easily scaffold ArkEnv inside your project.

  The CLI provides an interactive wizard to onboard your project to ArkEnv with optimal configuration for your specific framework and schema validator.

  **Features:**

  - **Framework Detection**: Automatically detects if you are using Vite, Bun, or Node.js to provide the correct installation instructions.
  - **Validator Selection**: Supports scaffolding environment templates using ArkType (recommended), Zod, or Valibot.
  - **Strict Mode Enforcement**: Checks and prompts to enforce `strict: true` in your `tsconfig.json` for proper type safety.

  **Usage:**

  Run the CLI in your project root using your preferred package manager:

  ```bash
  pnpm dlx @arkenv/cli init
  # or
  npx @arkenv/cli init
  # or
  bunx @arkenv/cli init
  ```
