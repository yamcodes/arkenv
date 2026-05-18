# @arkenv/cli

## 0.0.10

### Patch Changes

- #### Add "(Recommended)" label to various prompts for consistency _[`da77efb`](https://github.com/yamcodes/arkenv/commit/da77efb0ff22a998848f94f357cb5e3ced325b98) [@yamcodes](https://github.com/yamcodes)_
- #### Fix init wizard for Ctrl+C _[`#1024`](https://github.com/yamcodes/arkenv/pull/1024) [`f829e54`](https://github.com/yamcodes/arkenv/commit/f829e543c7e9811b116211c0208a2bd99ab0c840) [@yamcodes](https://github.com/yamcodes)_

  Fix the init wizard to abort immediately when prompts are canceled or overwrite is declined.

## 0.0.9

### Patch Changes

- #### Refined setup experience in `arkenv init` _[`#1016`](https://github.com/yamcodes/arkenv/pull/1016) [`d536ed7`](https://github.com/yamcodes/arkenv/commit/d536ed7f481f5b81df75329e2eee46c3f9ce1b91) [@yamcodes](https://github.com/yamcodes)_

  - **Clearer Framework Options**: Updated terminology to better distinguish between server-side runtime validation and client-side bundling integrations.
  - **Architecture Detection**: Improved detection logic recommends the most efficient configuration based on your project's features.
  - **Better In-File Guidance**: Generated templates now include comments clarifying validation behavior for your specific environment.

- #### Add keyboard navigation hints _[`ac3adcc`](https://github.com/yamcodes/arkenv/commit/ac3adcc26a121975981655fb5c339e95084328bf) [@yamcodes](https://github.com/yamcodes)_
- #### Improve Ctrl+C handling and implement graceful shutdown _[`#1019`](https://github.com/yamcodes/arkenv/pull/1019) [`102ce4a`](https://github.com/yamcodes/arkenv/commit/102ce4a60b82b88734d3d7c81d4ae430738bc277) [@yamcodes](https://github.com/yamcodes)_

  - Implemented graceful shutdown for `SIGINT` (Ctrl+C) to flush logs and JSON data, with a 2-second safety timeout and support for immediate exit on a second Ctrl+C.
  - Corrected exit code (130) for `SIGINT` terminations.
  - Fixed a bug where the `init` wizard would continue after a prompt was cancelled.

- #### Respect `tsconfig.json` for path resolution and scaffolding _[`#1013`](https://github.com/yamcodes/arkenv/pull/1013) [`0a18edd`](https://github.com/yamcodes/arkenv/commit/0a18edd97564b5b178bd20235a1bb0c20ed375ab) [@yamcodes](https://github.com/yamcodes)_

  The Arkenv CLI now dynamically resolves configuration paths and scans project files by respecting `tsconfig.json` settings (`rootDir`, `paths`, `baseUrl`).

  Key improvements include:

  - **Robust `tsconfig` Parser**: Added support for parsing `tsconfig.json` files with comments (`jsonc-parser`), handling `extends`, `rootDir`, `baseUrl`, and `paths` alias resolution.
  - **Dynamic Scaffolding Defaults**: Updated `init` scaffolding logic to suggest project-appropriate default paths based on `compilerOptions.rootDir` rather than hardcoding `./src/env.ts`.
  - **Advanced Environment Scanning**: Enhanced `getEnvExampleKeys` to scan project source files for `process.env` and `import.meta.env` usages, correctly resolving aliased imports (e.g. `@/env`).
  - **Framework & Package Manager Detection**: Leveraged parsed `tsconfig.json` context to accurately identify project frameworks and package managers.

## 0.0.8

### Patch Changes

- #### Fix JSON output routing and improve CLI reliability _[`#1000`](https://github.com/yamcodes/arkenv/pull/1000) [`ce1a849`](https://github.com/yamcodes/arkenv/commit/ce1a8496be36960078cdae87b9ae980e1d7dfd79) [@yamcodes](https://github.com/yamcodes)_

  Fixed several inconsistencies in how the CLI reports its progress and errors:

  - **Correct JSON Stream Routing**: When using `--json`, interactive logs and progress updates are now correctly routed to `stderr`. This ensures that `stdout` contains only valid, pipeable JSON data.
  - **Improved Silent Mode**: Fixed a bug where some ANSI escape codes could leak into the output when running in `--quiet` mode.
  - **Accurate Exit Codes**: The CLI now consistently exits with a non-zero status code when a process is cancelled or fails, improving compatibility with CI/CD pipelines.
  - **Safer Error Logging**: Error stacks and crash details are now routed exclusively to `stderr`, preventing them from corrupting structured output.

- #### Improve CLI output formatting and visual consistency _[`#1008`](https://github.com/yamcodes/arkenv/pull/1008) [`7228020`](https://github.com/yamcodes/arkenv/commit/722802003cc0425db73add2937403ba57d8b2efa) [@yamcodes](https://github.com/yamcodes)_

  - Standardized formatting of paths, filenames, and commands using a light blue color.
  - Updated all interactive prompts and instruction messages to use consistent code styling.

- #### Improve reliability and transparency of initialization process _[`#1000`](https://github.com/yamcodes/arkenv/pull/1000) [`ce1a849`](https://github.com/yamcodes/arkenv/commit/ce1a8496be36960078cdae87b9ae980e1d7dfd79) [@yamcodes](https://github.com/yamcodes)_

  Improved the `init` command to be more robust and informative:

  - **Resilient Scaffolding**: The initialization process is now more atomic, validating the plan before applying changes to minimize partial configurations on failure.
  - **Enhanced Debugging in Quiet Mode**: When running with `--quiet` (common in CI), output from dependency installation is now buffered and only displayed if the installation fails, providing critical context without cluttering successful runs.
  - **Improved Framework Detection**: Auto-detection of Bun environments is now more reliable, correctly identifying the runtime even when dependencies are not yet installed.
  - **Clearer Error Reporting**: Provides more specific error messages and instructions when individual scaffolding steps fail.

- #### Robust project configuration and comment preservation _[`#1000`](https://github.com/yamcodes/arkenv/pull/1000) [`ce1a849`](https://github.com/yamcodes/arkenv/commit/ce1a8496be36960078cdae87b9ae980e1d7dfd79) [@yamcodes](https://github.com/yamcodes)_

  Improved how the CLI modifies project files to be more respectful of user configuration:

  - **Preserve Comments and Formatting**: Updating `tsconfig.json` now uses a non-destructive parser that preserves your comments, indentation, and existing formatting.
  - **Reliable Plugin Injection**: Injection of ArkEnv plugins into `vite.config.ts` and `bun.config.ts` now uses AST-based manipulation, making it much more robust against varied coding styles and existing configurations.
  - **Improved Atomic Writes**: File system operations now use a more centralized and tested abstraction, reducing the risk of file corruption during scaffolding.

## 0.0.7

### Patch Changes

- #### Prevent duplicate ArkEnv type injections in `env.d.ts` _[`#987`](https://github.com/yamcodes/arkenv/pull/987) [`6403a08`](https://github.com/yamcodes/arkenv/commit/6403a080178f1ccd58519e65ed4e6f69b9af0aff) [@yamcodes](https://github.com/yamcodes)_

  Fixed an issue where the CLI would append ArkEnv type definitions multiple times if the `// @arkenv-types` marker was missing but the types were already present. The CLI now detects existing `ImportMetaEnvAugmented` (Vite) and `ProcessEnvAugmented` (Bun) definitions to avoid duplication.

- #### Improve CLI feedback for Vite config and type definitions _[`#992`](https://github.com/yamcodes/arkenv/pull/992) [`b89a7e8`](https://github.com/yamcodes/arkenv/commit/b89a7e88effa6705c6de41a6238342140ac30692) [@yamcodes](https://github.com/yamcodes)_

  - Only log "Updated vite.config.ts" if the file was actually modified.
  - Clarify the type definition append step and provide feedback if the update was skipped.

## 0.0.6

### Patch Changes

- #### Generate `env.d.ts` file for plugins _[`#969`](https://github.com/yamcodes/arkenv/pull/969) [`93389bd`](https://github.com/yamcodes/arkenv/commit/93389bd185e47c1bc62383f666e14afd244128a8) [@yamcodes](https://github.com/yamcodes)_

  When installing the Vite plugin or the Bun plugin, a matching `env.d.ts` will be generated if one is not present.

  If one _is_ present, the CLI will offer to append the necessary types to it.

  This allows for typesafety when calling via `process.env` or `import.meta.env`, see: https://arkenv.js.org/docs/vite-plugin/typing-import-meta-env

- #### Add default values to the initial env keys _[`07eed0f`](https://github.com/yamcodes/arkenv/commit/07eed0f8a7288f8e31f5e2e22a6d37648e82b84e) [@yamcodes](https://github.com/yamcodes)_

  The initial env keys (`NODE_ENV`, `PORT`) now recieve default values so the code runs even if the user didn't set them up in their `.env` file.

## 0.0.5

### Patch Changes

- #### Add agent skill support _[`#945`](https://github.com/yamcodes/arkenv/pull/945) [`63d6237`](https://github.com/yamcodes/arkenv/commit/63d6237d5d928e965aca64e473e7940eedc019cf) [@yamcodes](https://github.com/yamcodes)_

  The CLI now has a new `--agent` flag that lets the ArkEnv agent skill interact with it in a token-sensitive way. The skill has been updated to support this new mode.

  Also, the CLI will now suggest to install the agent skill for you when in non-`--agent` mode.

  Read more in the [ArkEnv CLI docs](https://arkenv.js.org/docs/cli).

- #### Improve "done" message text _[`#954`](https://github.com/yamcodes/arkenv/pull/954) [`fe10ef4`](https://github.com/yamcodes/arkenv/commit/fe10ef416d4605a3f0486d2dd32a68c7a6521d95) [@yamcodes](https://github.com/yamcodes)_

  The output now clearly distinguishes between the local scaffolding and the AI-powered refinement:

  ```
      1 │
      2 ◇  Next steps ─────────────────────────────────────────────────────────────────╮
      3 │                                                                              │
      4 │  1. Check ./src/env.ts and refine your environment schema.                   │
      5 │  2. Import and use: import { env } from "./src/env"                          │
      6 │  3. (Recommended) Install the AI skill: pnpm dlx skills add yamcodes/arkenv  │
      7 │     Then run /arkenv inside your AI assistant to finish.                     │
      8 │                                                                              │
      9 ├──────────────────────────────────────────────────────────────────────────────╯
     10 │
     11 └  ⛯ ArkEnv scaffolding complete. Happy coding!
  ```

- #### Install framework plugins _[`#948`](https://github.com/yamcodes/arkenv/pull/948) [`1dca74c`](https://github.com/yamcodes/arkenv/commit/1dca74c26a00681794943526ada6923a5aee6330) [@yamcodes](https://github.com/yamcodes)_

  The ArkEnv CLI now installs framework plugins as part of the scaffolding process if a relevant runtime/framework is selected.

- #### Passthrough `--yes` and `--quiet` to underlying process _[`#952`](https://github.com/yamcodes/arkenv/pull/952) [`10cbb7d`](https://github.com/yamcodes/arkenv/commit/10cbb7d4061ad868f313660709db39e35260c94e) [@yamcodes](https://github.com/yamcodes)_

  The ArkEnv CLI will now pass the flags `--yes` and `--quiet` to underlying processes.

  This means that if you run:

  ```sh
  pnx @arkenv/cli init --yes
  ```

  It would now use the recommended settings and avoid prompts even in sub-processes like the Vercel Skills process to add the ArkEnv skill.

  Similarly, if you run:

  ```sh
  pnx @arkenv/cli init --quiet
  ```

  You will not be exposed to the underlying Vercel Skills output, except for errors which are buffered in memory. (Resolves on exit code 0, discarding buffered output on success)

## 0.0.4

### Patch Changes

- #### Add ArkEnv Agent Skill as recommended next step _[`#944`](https://github.com/yamcodes/arkenv/pull/944) [`718fb4b`](https://github.com/yamcodes/arkenv/commit/718fb4bdfbefca9cbf4da32abf252642f5f19377) [@yamcodes](https://github.com/yamcodes)_
- #### Adapt CLI templates for framework plugins (Vite/Bun) _[`#943`](https://github.com/yamcodes/arkenv/pull/943) [`eba2f83`](https://github.com/yamcodes/arkenv/commit/eba2f83090bec585961da834473af2647837d5e1) [@yamcodes](https://github.com/yamcodes)_

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
  pnx @arkenv/cli init
  # or
  npx @arkenv/cli init
  # or
  bunx @arkenv/cli init
  ```
