# @arkenv/cli

## 0.2.4

### Patch Changes

- #### Fix empty sections in Next.js scaffolded schema _[`7756fcf`](https://github.com/yamcodes/arkenv/commit/7756fcf2bb5012c65d61783d6dda96976fbffe11) [@yamcodes](https://github.com/yamcodes)_

  The CLI no longer emits empty `server: {}`, `client: {}`, or `shared: {}` blocks when no variables belong to that section. Previously, scaffolding a project with no `NEXT_PUBLIC_*` variables produced `client: {}`, which caused a TypeScript error:

  ```
  Type '{}' is missing the following properties from type '{ PORT: never; NODE_ENV: never; }': PORT, NODE_ENV
  ```

  `server`, `client`, and `shared` sections are now conditionally omitted when empty. `runtimeEnv` is always emitted as it is required by `@arkenv/nextjs`. This applies across all three validator templates (ArkType, Zod, Valibot).

## 0.2.3

### Patch Changes

- #### Add Next.js support to ArkEnv CLI _[`97f4c17`](https://github.com/yamcodes/arkenv/commit/97f4c17088cfe8e5554ebc232d3faedb71492049) [@yamcodes](https://github.com/yamcodes)_

  ArkEnv CLI now fully supports initializing ArkEnv in Next.js projects.

  - Automatically detect Next.js projects via `package.json` dependencies or config files (`next.config.ts`, `next.config.js`, etc.).
  - Configure framework settings, skip redundant type definition scaffolding, and install `@arkenv/nextjs` along with `arktype` (which is required by the integration, even when selecting a different validator like Zod or Valibot).
  - Dynamically split detected variables into `server`, `client`, and `shared` fields based on the selected validator (ArkType, Zod, or Valibot), mapping browser/shared variables in the `runtimeEnv` block to prevent server secrets from leaking.

## 0.2.2

### Patch Changes

- #### Allow scaffolding into non-empty directory when `--force` is used _[`#1061`](https://github.com/yamcodes/arkenv/pull/1061) [`3a08754`](https://github.com/yamcodes/arkenv/commit/3a08754d39dd36a5e1715bd7ffcc6135e91371ef) [@yamcodes](https://github.com/yamcodes)_

  Ensure `--force` permits new-project scaffolding into a non-empty directory (e.g. `.`) while preventing silent overwrites of user files via a preflight collision check.

- #### Refactor prompt wizard and steps to be pure and typesafe _[`#1060`](https://github.com/yamcodes/arkenv/pull/1060) [`85380d6`](https://github.com/yamcodes/arkenv/commit/85380d624c09d473e04cc14382074bbfc06dbf11) [@yamcodes](https://github.com/yamcodes)_

  Refactored the interactive prompt wizard and individual steps to be pure, modular, and typesafe. Steps now accept explicit configuration options and return normalized results instead of reading the filesystem directly or relying on global mock state.

- #### Strip example `packageManager` fields during scaffolding _[`#1055`](https://github.com/yamcodes/arkenv/pull/1055) [`a30c9ae`](https://github.com/yamcodes/arkenv/commit/a30c9ae949c11f7a1d859c26f2049cda1a7b33f0) [@pullfrog](https://github.com/apps/pullfrog)_

  Remove copied example `packageManager` fields during new project scaffolding so installs use the package manager selected by the CLI.

## 0.2.1

### Patch Changes

- #### Fix --help table alignment _[`#1052`](https://github.com/yamcodes/arkenv/pull/1052) [`cf7bd02`](https://github.com/yamcodes/arkenv/commit/cf7bd022ab5477cf5bfbb2132b4d09fac703b9cf) [@yamcodes](https://github.com/yamcodes)_
- #### Support POSIX-style short-flag bundling in CLI parser _[`#1047`](https://github.com/yamcodes/arkenv/pull/1047) [`b2e4865`](https://github.com/yamcodes/arkenv/commit/b2e4865dfa5cd84370781899d7f0862dbff544d5) [@yamcodes](https://github.com/yamcodes)_

  Enables combining multiple short flags (e.g. `-yq` instead of `-y -q` or `-yfq` instead of `-y -f -q`) in CLI commands. Flag values starting with `-` (e.g. `init -e -abc`) are preserved without expansion.

- #### Validate valued CLI flags and reject missing values _[`#1051`](https://github.com/yamcodes/arkenv/pull/1051) [`dec2581`](https://github.com/yamcodes/arkenv/commit/dec2581e87d10fd45835f9bad1666a62068975b2) [@yamcodes](https://github.com/yamcodes)_

  Add parser-level validation to reject flags that require a value (e.g. `--example` or `-e`) when they are passed without one. A validation error message is set, and the CLI exits with status code 1.

## 0.2.0

### Minor Changes

- #### Replace `--name`/`-n` flag with `[project-name]` positional argument on `init` command _[`#1041`](https://github.com/yamcodes/arkenv/pull/1041) [`3c1c462`](https://github.com/yamcodes/arkenv/commit/3c1c462b3ac763dbe405a507fee71ef01a5a1e1c) [@yamcodes](https://github.com/yamcodes)_

  The `init` command now accepts an optional `[project-name]` positional argument (e.g., `arkenv init my-new-project` or `arkenv init .`).

  The `--name` and `-n` flags have been removed.

  **BREAKING CHANGE**: The `--name` / `-n` flags are no longer supported and will result in a parsing error. Use the positional `[project-name]` argument instead.

### Patch Changes

- #### Fix working directory resolution when executing via monorepo scripts _[`169d9bf`](https://github.com/yamcodes/arkenv/commit/169d9bf3028a4ec50a8938742f635bae63286a3e) [@yamcodes](https://github.com/yamcodes)_

  Ensure that the CLI processes paths and directory status checks relative to the directory where the command was initiated (`INIT_CWD`), rather than the monorepo root.

  This fixes issues where running the CLI locally via workspace runners like `pnpm arkenv` from outside the workspace root failed with empty-directory checks.

- #### Fix scaffolding templates for Zod and Valibot validators _[`#1034`](https://github.com/yamcodes/arkenv/pull/1034) [`1c0dbb9`](https://github.com/yamcodes/arkenv/commit/1c0dbb9d9fa8ca1e8b289b895ca8b3d0838a4ecd) [@yamcodes](https://github.com/yamcodes)_

  Vite and Bun fullstack templates now wrap schemas in `type({...})`:

  ```ts
  import { type } from "arkenv";
  import { z } from "zod";

  export const Env = type({
    PORT: z.coerce.number(),
  });
  ```

  Vanilla templates now call `arkenv({...})` directly without wrapping:

  ```ts
  import arkenv from "arkenv/standard";
  import { z } from "zod";

  export const env = arkenv({
    PORT: z.coerce.number(),
  });
  ```

- #### `--example` now forces the new-project wizard regardless of the current directory _[`#1042`](https://github.com/yamcodes/arkenv/pull/1042) [`9116f33`](https://github.com/yamcodes/arkenv/commit/9116f3329ddf0203df046980afa13b2a218ccd1a) [@yamcodes](https://github.com/yamcodes)_

  Previously, passing `--example` in a non-empty directory (or one that already has a
  `package.json`) would silently fall through to the existing-project flow, ignoring the
  flag entirely. The flag now always triggers the new-project wizard:

  ```sh
  # Works even in a non-empty directory or one with package.json
  arkenv init --example basic
  ```

  **Special case – `arkenv init . --example basic`**: If you explicitly pass `.` as the
  project name (or type it at the prompt) and the current directory is **not empty**, the
  CLI aborts with a clear error instead of scaffolding into the dirty directory. When the
  directory **is** empty, `.` is used for the current directory while the package name is
  normalized to the current directory's basename as before.

## 0.1.0

### Minor Changes

- #### Enforce technical requirements during `arkenv init` _[`#1028`](https://github.com/yamcodes/arkenv/pull/1028) [`77e7235`](https://github.com/yamcodes/arkenv/commit/77e7235f082d3a8006694eb7a4c2ad4535427655) [@yamcodes](https://github.com/yamcodes)_

  **BREAKING CHANGE**: The CLI now performs early checks for technical requirements and will exit with an error if they are not met.

  The following requirements are now enforced:

  - Node.js version >= 22
  - TypeScript version >= 5.1
  - `strict: true` in `tsconfig.json`
  - `moduleResolution` set to `bundler`, `node16`, or `nodenext` in `tsconfig.json`
  - Existence of `package.json`

  **Migration**: Ensure your environment and configuration meet these requirements before running `arkenv init`. If you need to bypass these checks, or force scaffolding in a non-empty directory, use the `--force` (or `-f`) flag.

### Patch Changes

- #### Fix pluralization and 0-case in environment variable detection messages _[`1c4f566`](https://github.com/yamcodes/arkenv/commit/1c4f566d4812c4eaaef03f6cb3ec2598bb39d372) [@yamcodes](https://github.com/yamcodes)_

  The CLI now correctly handles singular and plural cases for detected environment variables (e.g., "1 key" vs "2 keys"). It also correctly suppresses the prompt when no variables are detected.

- #### Add "New Project Flow" into `arkenv init` _[`#1030`](https://github.com/yamcodes/arkenv/pull/1030) [`216d232`](https://github.com/yamcodes/arkenv/commit/216d232d92eb0e777605766572a7898bcf283c2e) [@yamcodes](https://github.com/yamcodes)_

  The `arkenv init` command now supports scaffolding complete projects from verified examples when run in an empty directory.

  - **Smart Detection**: Automatically enters "New Project Flow" in empty directories or when `--force` is used.
  - **Example Selection**: Interactive prompt to choose from curated examples (Vite, Bun, Zod, etc.).
  - **New Flags**:
    - `--example`, `-e`: Skip the prompt and specify an example name (e.g., `with-vite-react`).
    - `--name`, `-n`: Specify the project name for the scaffolded project.
  - **Auto-Install**: Automatically detects and runs the package manager's installation command.

  Usage:

  ```bash
  # Interactive flow in an empty directory
  arkenv init

  # Non-interactive scaffolding
  arkenv init --example with-vite-react --name my-new-app
  ```

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
