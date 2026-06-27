# @ArkEnv/CLI

## 0.3.1

### Patch Changes

- #### Add `codegen: false` option to `@arkenv/nextjs/config` _[`#1236`](https://github.com/yamcodes/arkenv/pull/1236) [`062034f`](https://github.com/yamcodes/arkenv/commit/062034f17fa63393a2943fa176975e8096be9efd) [@yamcodes](https://github.com/yamcodes)_

  Add a `codegen` option to `withArkEnv` and `setupArkEnv` that disables automatic `env.gen.ts` generation while keeping build-time environment validation active.

  Usage:

  ```ts title="next.config.ts"
  import { withArkEnv } from "@arkenv/nextjs/config";
  import type { NextConfig } from "next";

  const nextConfig: NextConfig = {};
  export default withArkEnv(nextConfig, { codegen: false });
  ```

  When `codegen` is `false`, provide a manual `runtimeEnv` mapping in your schema file. The CLI's `--no-codegen` flag now also skips generating `env.gen.ts` during scaffolding while still wrapping `next.config.ts` with `withArkEnv(nextConfig, { codegen: false })`.

## 0.3.0

### Minor Changes

- #### Deprecate Next.js nested layout and add CLI `--flat` flag _[`#1218`](https://github.com/yamcodes/arkenv/pull/1218) [`2343378`](https://github.com/yamcodes/arkenv/commit/234337898e2bca93a3a326a0daaa4d2dd5306b08) [@yamcodes](https://github.com/yamcodes)_
  - Deprecate the legacy nested options overload signature of `createEnv` in `@arkenv/nextjs`.
  - Add a one-time development-only runtime warning nudge when the legacy nested layout format is detected.
  - Add the `--flat` flag to `@arkenv/cli` to scaffold the recommended flat layout for Next.js.
  - **BREAKING CHANGE**: Drop support for the `@arkenv/cli` `--simple` flag on Next.js projects; passing it now hard-fails with an error. Run `npx arkenv init` instead (the flat layout is now the default).
  - Remove the nested layout choice from the Next.js interactive CLI prompt, defaulting to flat.
  - Remove the standalone nested layout documentation page and redirect its URL to the FAQ.
  - Update the documentation to guide users from the legacy nested layout to the recommended flat layout.

### Patch Changes

- #### Add Flat Layout Mode for Next.js integration _[`#1218`](https://github.com/yamcodes/arkenv/pull/1218) [`2343378`](https://github.com/yamcodes/arkenv/commit/234337898e2bca93a3a326a0daaa4d2dd5306b08) [@yamcodes](https://github.com/yamcodes)_

  Introduce a new "Flat" layout mode for `@arkenv/nextjs`. The Flat API allows developers to define a flat schema mapping directly to their `.env` file structure:

  ```ts
  import arkenv from "./generated/env.gen";

  export const env = arkenv(
    {
      DATABASE_URL: "string",
      NEXT_PUBLIC_API_URL: "string",
      NODE_ENV: "'development' | 'production' | 'test' = 'development'",
      CUSTOM_VAR: "string",
    },
    {
      exposeToClient: ["CUSTOM_VAR"],
    },
  );
  ```

  - Automatically expose `NEXT_PUBLIC_` variables and custom keys specified in `options.exposeToClient` to the client.
  - Secure server-only variables at runtime via a Proxy that throws on unauthorized client access.
  - Share `NODE_ENV` implicitly to match [standard Next.js build-time inlining behavior.](https://nextjs.org/docs/app/guides/environment-variables)
  - Rename the configuration `layout` option value from `"simple"` to `"flat"`. `"simple"` is kept as a deprecated runtime alias and will be removed in the next major version.
  - Update CLI scaffolding to generate the Flat layout by default.
  - Update documentation and playground/example apps to use and recommend the Flat layout strategy.

## 0.2.11

### Patch Changes

- #### Introduce Nuxt support _[`#1191`](https://github.com/yamcodes/arkenv/pull/1191) [`a3e32db`](https://github.com/yamcodes/arkenv/commit/a3e32db63b0b694e11487950507c06fa7b1466b0) [@yamcodes](https://github.com/yamcodes)_

  Introduce `@arkenv/nuxt` integration package providing a Nuxt module for automatic environment variable validation and runtimeConfig mapping, and add Nuxt support to the CLI scaffold wizard. The Nuxt adapter elegantly embraces Nuxt's native configuration exposure by automatically reading from `window.__NUXT__.config.public`, eliminating the need for developers to manually pass a `runtimeEnv` or `useRuntimeConfig()` map.

## 0.2.10

### Patch Changes

- #### Check git working tree is clean before `arkenv init` _[`#1151`](https://github.com/yamcodes/arkenv/pull/1151) [`4e6300c`](https://github.com/yamcodes/arkenv/commit/4e6300cb769efd626a69edbf7a38f520e796f386) [@yamcodes](https://github.com/yamcodes)_

  The CLI now verifies the git working tree is clean before modifying files in the existing-project flow. If the working tree is dirty and `--force` is not provided, the command aborts with a clear error message. Use `--force` to bypass this check.

  Non-git repositories and clean working trees proceed normally without any extra prompts.

- #### Automatically wrap Next.js config with `withArkEnv` during `arkenv init` _[`#1150`](https://github.com/yamcodes/arkenv/pull/1150) [`4a267e5`](https://github.com/yamcodes/arkenv/commit/4a267e5c1ca18fc2ac7ba720decb6681834f9ebf) [@yamcodes](https://github.com/yamcodes)_

  Running `arkenv init` in a Next.js project now auto-detects `next.config.ts` (or `.js`/`.mts`/`.mjs`) and wraps the default export with `withArkEnv`:

  ```ts
  // next.config.ts - before
  export default {
    experimental: {},
  };

  // next.config.ts - after
  import { withArkEnv } from "@arkenv/nextjs/config";
  export default withArkEnv({
    experimental: {},
  });
  ```

  - Add `transformNextjsConfig` AST transformer to wrap default exports with `withArkEnv` using magicast
  - Add `findNextjsConfig` and `bootstrapNextjsConfig` utilities for Next.js config discovery and mutation
  - Integrate Next.js config bootstrapping into the CLI executor during `arkenv init`
  - Fix next-steps suppression: show manual `withArkEnv` instructions even when the AI skill is detected if auto-bootstrapping failed

## 0.2.9

### Patch Changes

- #### Update Next.js scaffold templates to use default import `arkenv` _[`#1140`](https://github.com/yamcodes/arkenv/pull/1140) [`befcefa`](https://github.com/yamcodes/arkenv/commit/befcefa83f6823f4c3f5e54a83ee5ae1112e1e55) [@yamcodes](https://github.com/yamcodes)_

  Change the generated `env.ts` templates to import the default `arkenv` factory from the generated config helper instead of the named `createEnv` import, ensuring compatibility with the ArkType IDE extension.

- #### Improve readability of recommended framework option in init wizard _[`2bd5cd4`](https://github.com/yamcodes/arkenv/commit/2bd5cd4f71fc091348df2fde2c3ccddd6d89d9d9) [@yamcodes](https://github.com/yamcodes)_

  Move the "(Recommended)" text from the framework selection hint to the option label to make the recommendation more prominent during initialization.

- #### Restrict Next.js shared scaffold templates to NODE*ENV *[`#1135`](https://github.com/yamcodes/arkenv/pull/1135) [`2ab778e`](https://github.com/yamcodes/arkenv/commit/2ab778eda2c3920009ad577e091ee0cfd68d71b7) [@yamcodes](https://github.com/yamcodes)_

  Treat `PORT` as a server-only variable instead of a shared variable in scaffold templates and strict layout generators. This ensures that custom variables or variables like `PORT` are not placed in `shared` sections, avoiding potential client-side hydration mismatches in Next.js applications.

## 0.2.8

### Patch Changes

- #### Default Next.js layout selection to Simple (1-file) layout _[`#1120`](https://github.com/yamcodes/arkenv/pull/1120) [`9563b47`](https://github.com/yamcodes/arkenv/commit/9563b47a69f376f5d91c84116c4ff36c50133837) [@yamcodes](https://github.com/yamcodes)_

  Change the CLI prompt layout selection ordering to present "Simple" as the recommended first choice and "Strict" as the second choice. Update the non-interactive wizard flow to default to the simple (Unified) layout.

- #### Fix env.gen import path in strict layout and export default alias _[`#1121`](https://github.com/yamcodes/arkenv/pull/1121) [`e75194e`](https://github.com/yamcodes/arkenv/commit/e75194e8883abea2ca2dd1b598b880977052d14f) [@yamcodes](https://github.com/yamcodes)_

  Correct the hardcoded import path to generated factory in Next.js 3-file strict mode client template. Also export `createEnv` as default export (aliased as `arkenv`) in the generated `env.gen.ts` file.

## 0.2.7

### Patch Changes

- #### Format empty schema objects cleanly in scaffolding _[`#1116`](https://github.com/yamcodes/arkenv/pull/1116) [`b62ebbd`](https://github.com/yamcodes/arkenv/commit/b62ebbd316db239295884a32348d1a496e8cd49b) [@yamcodes](https://github.com/yamcodes)_

  Format empty schema objects cleanly as `{}` on a single line (instead of multi-line empty blocks with trailing whitespace) during project scaffolding.

- #### Generate tailored `createEnv` factory in Next.js strict layout _[`#1116`](https://github.com/yamcodes/arkenv/pull/1116) [`b62ebbd`](https://github.com/yamcodes/arkenv/commit/b62ebbd316db239295884a32348d1a496e8cd49b) [@yamcodes](https://github.com/yamcodes)_

  Generate a tailored `createEnv` factory helper in `env.gen.ts` when using the strict split-schema layout (instead of exporting a raw `runtimeEnv` object).

  This eliminates the need to manually declare or reference the `runtimeEnv` object inside the client schema `client.ts` file, aligning it closer to the core `arkenv` experience of simply calling `createEnv(schema, options)`.

  Example usage in `client.ts`:

  ```ts
  import { createEnv } from "./generated/env.gen";
  import { SharedSchema } from "./internal/shared";

  export const env = createEnv(
    {
      NEXT_PUBLIC_API_URL: "string",
    },
    {
      extends: [SharedSchema],
    },
  );
  ```

- #### Support split schema layout in Next.js config wrapper _[`#1116`](https://github.com/yamcodes/arkenv/pull/1116) [`b62ebbd`](https://github.com/yamcodes/arkenv/commit/b62ebbd316db239295884a32348d1a496e8cd49b) [@yamcodes](https://github.com/yamcodes)_

  Add support for the strict split schema layout in the Next.js `withArkEnv` configuration wrapper and update CLI scaffolding instructions:
  - Add a `layout` option (`"simple" | "strict"`) to `withArkEnv` configuration, which defaults to auto-detecting the strict layout if split files (`env/internal/shared.ts`, `env/client.ts`, `env/server.ts`) exist.
  - Implement key extraction from strict client and shared schema files.
  - Update CLI next-steps messages to include `withArkEnv` wrapping instructions for strict layout nextjs projects.

## 0.2.6

### Patch Changes

- #### Implement Next.js separate files mode, shared entry point, and native extends API _[`#1084`](https://github.com/yamcodes/arkenv/pull/1084) [`d921785`](https://github.com/yamcodes/arkenv/commit/d92178567ed4cdd5227cc107bf98d148e5fae0c1) [@yamcodes](https://github.com/yamcodes)_

  Introduce dedicated entry points for `@arkenv/nextjs/server`, `@arkenv/nextjs/client`, and `@arkenv/nextjs/shared` to prevent metadata leakage and support compile-time bundler-enforced isolation. Add a native `extends` API to merge validated outputs of extended proxies while maintaining proxy-level protections.

  Also update the CLI `init` wizard to support interactive layout selection (Strict 3-file vs Simple 1-file) and `--strict` / `--simple` flags to bypass interactive selection.

  Example server usage:

  ```ts
  import { createEnv } from "@arkenv/nextjs/server";
  import { env as clientEnv } from "./env.client";

  export const env = createEnv(
    { DATABASE_URL: "string" },
    { extends: [clientEnv] },
  );
  ```

  Example client usage:

  ```ts
  import { createEnv } from "@arkenv/nextjs/client";

  export const env = createEnv(
    { NEXT_PUBLIC_API_URL: "string" },
    {
      runtimeEnv: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      },
    },
  );
  ```

- #### Update Next.js scaffolding template to use codegen workflow _[`#1092`](https://github.com/yamcodes/arkenv/pull/1092) [`c6c30ab`](https://github.com/yamcodes/arkenv/commit/c6c30abbc1df4bb74b2ab5c6f689fcae557ffb05) [@yamcodes](https://github.com/yamcodes)_

  Update the CLI `nextjs` scaffolding template to adopt the new `@arkenv/nextjs/config` codegen workflow. The generated `env.ts` file now imports the auto-generated `createEnv` factory from `env.gen.ts` instead of directly importing from `@arkenv/nextjs`, which eliminates the need to manually destructure `runtimeEnv` variables.

  Additionally, update the CLI usage instructions to guide developers on wrapping their Next.js configuration using the `withArkEnv` helper inside `next.config.ts`.

  #### Add `--no-codegen` CLI option and dedicated prompt for Next.js scaffolding

  Introduce a `--no-codegen` (or `-C`) option and an interactive prompt to allow developers to opt out of the Next.js automatic environment variable code generation workflow. When opted out, the CLI scaffolds the project to use standard runtimeEnv destructuring and skips post-scaffold code generation bootstrapping.

## 0.2.5

### Patch Changes

- #### Automatically detect installed ArkEnv agent skill _[`#1090`](https://github.com/yamcodes/arkenv/pull/1090) [`00f504f`](https://github.com/yamcodes/arkenv/commit/00f504f133e38b039cb2802a12162cee5efa1f23) [@yamcodes](https://github.com/yamcodes)_

  During initialization, check if the `arkenv` agent skill is already present in the workspace. If detected, the installation prompt and setup are bypassed, defaulting to `false`, and an informational message confirming the detection is logged.

- #### Scaffold scanned environment variables as optional types during bootstrap _[`#1083`](https://github.com/yamcodes/arkenv/pull/1083) [`182d1af`](https://github.com/yamcodes/arkenv/commit/182d1af57df5761adb217b0b823b0ddb6d2b5181) [@yamcodes](https://github.com/yamcodes)_

  The CLI now generates optional schemas without default fallback values for custom/scanned environment keys during bootstrap:
  - **ArkType**: Scaffolds fields with `"string?"` instead of `"string = ''"`
  - **Zod**: Scaffolds fields with `z.string().optional()` instead of `z.string().default("")`
  - **Valibot**: Scaffolds fields with `v.optional(v.string())` instead of `v.optional(v.string(), "")`

## 0.2.4

### Patch changes

- #### Fix empty sections in Next.js scaffolded schema _[`7756fcf`](https://github.com/yamcodes/arkenv/commit/7756fcf2bb5012c65d61783d6dda96976fbffe11) [@yamcodes](https://github.com/yamcodes)_

  The CLI no longer emits empty `server: {}`, `client: {}`, or `shared: {}` blocks when no variables belong to that section. Previously, scaffolding a project with no `NEXT_PUBLIC_*` variables produced `client: {}`, which caused a TypeScript error:

  ```
  Type '{}' is missing the following properties from type '{ PORT: never; NODE_ENV: never; }': PORT, NODE_ENV
  ```

  `server`, `client`, and `shared` sections are now conditionally omitted when empty. `runtimeEnv` is always emitted as it is required by `@arkenv/nextjs`. This applies across all three validator templates (ArkType, Zod, Valibot).

## 0.2.3

### Patch changes

- #### Add Next.js support to ArkEnv CLI _[`97f4c17`](https://github.com/yamcodes/arkenv/commit/97f4c17088cfe8e5554ebc232d3faedb71492049) [@yamcodes](https://github.com/yamcodes)_

  ArkEnv CLI now fully supports initializing ArkEnv in Next.js projects.
  - Automatically detect Next.js projects via `package.json` dependencies or config files (`next.config.ts`, `next.config.js`, etc.).
  - Configure framework settings, skip redundant type definition scaffolding, and install `@arkenv/nextjs` along with `arktype` (which is required by the integration, even when selecting a different validator like Zod or Valibot).
  - Dynamically split detected variables into `server`, `client`, and `shared` fields based on the selected validator (ArkType, Zod, or Valibot), mapping browser/shared variables in the `runtimeEnv` block to prevent server secrets from leaking.

## 0.2.2

### Patch changes

- #### Allow scaffolding into non-empty directory when `--force` is used _[`#1061`](https://github.com/yamcodes/arkenv/pull/1061) [`3a08754`](https://github.com/yamcodes/arkenv/commit/3a08754d39dd36a5e1715bd7ffcc6135e91371ef) [@yamcodes](https://github.com/yamcodes)_

  Ensure `--force` permits new-project scaffolding into a non-empty directory (e.g. `.`) while preventing silent overwrites of user files via a preflight collision check.

- #### Refactor prompt wizard and steps to be pure and typesafe _[`#1060`](https://github.com/yamcodes/arkenv/pull/1060) [`85380d6`](https://github.com/yamcodes/arkenv/commit/85380d624c09d473e04cc14382074bbfc06dbf11) [@yamcodes](https://github.com/yamcodes)_

  Refactored the interactive prompt wizard and individual steps to be pure, modular, and typesafe. Steps now accept explicit configuration options and return normalized results instead of reading the filesystem directly or relying on global mock state.

- #### Strip example `packageManager` fields during scaffolding _[`#1055`](https://github.com/yamcodes/arkenv/pull/1055) [`a30c9ae`](https://github.com/yamcodes/arkenv/commit/a30c9ae949c11f7a1d859c26f2049cda1a7b33f0) [@pullfrog](https://github.com/apps/pullfrog)_

  Remove copied example `packageManager` fields during new project scaffolding so installs use the package manager selected by the CLI.

## 0.2.1

### Patch changes

- #### Fix --help table alignment _[`#1052`](https://github.com/yamcodes/arkenv/pull/1052) [`cf7bd02`](https://github.com/yamcodes/arkenv/commit/cf7bd022ab5477cf5bfbb2132b4d09fac703b9cf) [@yamcodes](https://github.com/yamcodes)_

- #### Support POSIX-style short-flag bundling in CLI parser _[`#1047`](https://github.com/yamcodes/arkenv/pull/1047) [`b2e4865`](https://github.com/yamcodes/arkenv/commit/b2e4865dfa5cd84370781899d7f0862dbff544d5) [@yamcodes](https://github.com/yamcodes)_

  Enables combining multiple short flags (e.g. `-yq` instead of `-y -q` or `-yfq` instead of `-y -f -q`) in CLI commands. Flag values starting with `-` (e.g. `init -e -abc`) are preserved without expansion.

- #### Validate valued CLI flags and reject missing values _[`#1051`](https://github.com/yamcodes/arkenv/pull/1051) [`dec2581`](https://github.com/yamcodes/arkenv/commit/dec2581e87d10fd45835f9bad1666a62068975b2) [@yamcodes](https://github.com/yamcodes)_

  Add parser-level validation to reject flags that require a value (e.g. `--example` or `-e`) when they are passed without one. A validation error message is set, and the CLI exits with status code 1.

## 0.2.0

### Minor changes

- #### Replace `--name`/`-n` flag with `[project-name]` positional argument on `init` command _[`#1041`](https://github.com/yamcodes/arkenv/pull/1041) [`3c1c462`](https://github.com/yamcodes/arkenv/commit/3c1c462b3ac763dbe405a507fee71ef01a5a1e1c) [@yamcodes](https://github.com/yamcodes)_

  The `init` command now accepts an optional `[project-name]` positional argument (e.g., `arkenv init my-new-project` or `arkenv init .`).

  The `--name` and `-n` flags have been removed.

  **BREAKING CHANGE**: The `--name` / `-n` flags are no longer supported and will result in a parsing error. Use the positional `[project-name]` argument instead.

### Patch changes

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

### Minor changes

- #### Enforce technical requirements during `arkenv init` _[`#1028`](https://github.com/yamcodes/arkenv/pull/1028) [`77e7235`](https://github.com/yamcodes/arkenv/commit/77e7235f082d3a8006694eb7a4c2ad4535427655) [@yamcodes](https://github.com/yamcodes)_

  **BREAKING CHANGE**: The CLI now performs early checks for technical requirements and will exit with an error if they are not met.

  The following requirements are now enforced:
  - Node.js version >= 22
  - TypeScript version >= 5.1
  - `strict: true` in `tsconfig.json`
  - `moduleResolution` set to `bundler`, `node16`, or `nodenext` in `tsconfig.json`
  - Existence of `package.json`

  **Migration**: Ensure your environment and configuration meet these requirements before running `arkenv init`. If you need to bypass these checks, or force scaffolding in a non-empty directory, use the `--force` (or `-f`) flag.

### Patch changes

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

### Patch changes

- #### Add "(Recommended)" label to various prompts for consistency _[`da77efb`](https://github.com/yamcodes/arkenv/commit/da77efb0ff22a998848f94f357cb5e3ced325b98) [@yamcodes](https://github.com/yamcodes)_
- #### Fix init wizard for Ctrl+C _[`#1024`](https://github.com/yamcodes/arkenv/pull/1024) [`f829e54`](https://github.com/yamcodes/arkenv/commit/f829e543c7e9811b116211c0208a2bd99ab0c840) [@yamcodes](https://github.com/yamcodes)_

  Fix the init wizard to abort immediately when prompts are canceled or overwrite is declined.

## 0.0.9

### Patch changes

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

### Patch changes

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

### Patch changes

- #### Prevent duplicate ArkEnv type injections in `env.d.ts` _[`#987`](https://github.com/yamcodes/arkenv/pull/987) [`6403a08`](https://github.com/yamcodes/arkenv/commit/6403a080178f1ccd58519e65ed4e6f69b9af0aff) [@yamcodes](https://github.com/yamcodes)_

  Fixed an issue where the CLI would append ArkEnv type definitions multiple times if the `// @arkenv-types` marker was missing but the types were already present. The CLI now detects existing `ImportMetaEnvAugmented` (Vite) and `ProcessEnvAugmented` (Bun) definitions to avoid duplication.

- #### Improve CLI feedback for Vite config and type definitions _[`#992`](https://github.com/yamcodes/arkenv/pull/992) [`b89a7e8`](https://github.com/yamcodes/arkenv/commit/b89a7e88effa6705c6de41a6238342140ac30692) [@yamcodes](https://github.com/yamcodes)_
  - Only log "Updated vite.config.ts" if the file was actually modified.
  - Clarify the type definition append step and provide feedback if the update was skipped.

## 0.0.6

### Patch changes

- #### Generate `env.d.ts` file for plugins _[`#969`](https://github.com/yamcodes/arkenv/pull/969) [`93389bd`](https://github.com/yamcodes/arkenv/commit/93389bd185e47c1bc62383f666e14afd244128a8) [@yamcodes](https://github.com/yamcodes)_

  When installing the Vite plugin or the Bun plugin, a matching `env.d.ts` will be generated if one is not present.

  If one _is_ present, the CLI will offer to append the necessary types to it.

  This allows for typesafety when calling via `process.env` or `import.meta.env`, see: [https://arkenv.js.org/docs/vite-plugin/typing-import-meta-env](https://arkenv.js.org/docs/vite-plugin/typing-import-meta-env)

- #### Add default values to the initial env keys _[`07eed0f`](https://github.com/yamcodes/arkenv/commit/07eed0f8a7288f8e31f5e2e22a6d37648e82b84e) [@yamcodes](https://github.com/yamcodes)_

  The initial env keys (`NODE_ENV`, `PORT`) now recieve default values so the code runs even if the user didn't set them up in their `.env` file.

## 0.0.5

### Patch changes

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

### Patch changes

- #### Add ArkEnv Agent Skill as recommended next step _[`#944`](https://github.com/yamcodes/arkenv/pull/944) [`718fb4b`](https://github.com/yamcodes/arkenv/commit/718fb4bdfbefca9cbf4da32abf252642f5f19377) [@yamcodes](https://github.com/yamcodes)_
- #### Adapt CLI templates for framework plugins (Vite/Bun) _[`#943`](https://github.com/yamcodes/arkenv/pull/943) [`eba2f83`](https://github.com/yamcodes/arkenv/commit/eba2f83090bec585961da834473af2647837d5e1) [@yamcodes](https://github.com/yamcodes)_

## 0.0.3

### Patch changes

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

### Patch changes

- #### Ctrl+C now quits the CLI _[`0781031`](https://github.com/yamcodes/arkenv/commit/07810318a75f74d9c57b90f665ef1e5b2117b5fc) [@yamcodes](https://github.com/yamcodes)_
- #### Detect existing setups _[`0781031`](https://github.com/yamcodes/arkenv/commit/07810318a75f74d9c57b90f665ef1e5b2117b5fc) [@yamcodes](https://github.com/yamcodes)_

  The CLI now checks for an existing ArkEnv setup and offers to abort or override accordingly.

## 0.0.1

### Patch changes

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
