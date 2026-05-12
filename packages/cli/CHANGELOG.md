# @arkenv/cli

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
