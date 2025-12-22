<p align="center">
  <a href="https://github.com/yamcodes/arkenv/blob/main/apps/www/public/assets/icon.svg"><img alt="ArkEnv Logo" src="https://arkenv.js.org/assets/icon.svg" width="160px" align="center"/></a>
  <h1 align="center">ArkEnv</h1>
  <div align="center">
    <p align="center">Typesafe environment variables <br/>
    powered by <a href="https://github.com/arktypeio/arktype">ArkType</a></p>
  <a href="https://github.com/yamcodes/arkenv/actions/workflows/test.yml?query=branch%3Amain"><img alt="Test Status" src="https://github.com/yamcodes/arkenv/actions/workflows/tests-badge.yml/badge.svg?branch=main"></a>
  <a href="https://bundlephobia.com/package/arkenv"><img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/arkenv"></a>
  <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white"></a>
  <a href="https://arktype.io/"><img alt="Powered By ArkType" src="https://custom-icon-badges.demolab.com/badge/ArkType-0d1526?logo=arktype2&logoColor=e9eef9"></a>
  <a href="https://nodejs.org/en"><img alt="Node.js" src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white"></a>
  <a href="https://bun.com/"><img alt="Bun" src="https://img.shields.io/badge/Bun-14151a?logo=bun&logoColor=fbf0df"></a>
  <a href="https://vite.dev/"><img alt="Vite" src="https://custom-icon-badges.demolab.com/badge/Vite-2e2742?logo=vite2&logoColor=dfdfd6"></a>
  <a href="https://discord.gg/zAmUyuxXH9"><img alt="Chat on Discord" src="https://img.shields.io/discord/957797212103016458?label=Chat&color=5865f4&logo=discord&labelColor=121214"></a>
  <a href="#contributors"><img alt="All Contributors" src="https://img.shields.io/github/all-contributors/yamcodes/arkenv?color=ee8449&style=flat"></a>
    </div>
</p>
<h3 align="center">Proud member of the <a href="https://arktype.io/docs/ecosystem#arkenv">ArkType ecosystem</a></h3>

<p align="center">
  <img alt="ArkEnv Demo" src="https://arkenv.js.org/assets/demo.gif" />
</p>

<br/>
<br/>
<br/>

### [Read the docs →](https://arkenv.js.org/docs/arkenv)

<br/>
<br/>

## Introduction

> [!TIP]
> 📖 **Reading this on GitHub?** Check out [this page in our docs](https://arkenv.js.org/docs/arkenv) to hover over code blocks and get type hints!

ArkEnv is an environment variable parser powered by [ArkType](https://arktype.io/), TypeScript's 1:1 validator. ArkEnv lets you use familiar TypeScript-like syntax to create a ready-to-use, typesafe environment variable object:

```ts twoslash
import arkenv from "arkenv";

const env = arkenv({
  HOST: "string.ip | 'localhost'",
  PORT: "0 <= number.integer <= 65535",
  NODE_ENV: "'development' | 'production' | 'test' = 'development'",
  DEBUGGING: "boolean = false",
});

// Hover to see ✨exact✨ types
const host = env.HOST;
const port = env.PORT;
const nodeEnv = env.NODE_ENV;
const debugging = env.DEBUGGING;
```

With ArkEnv, your environment variables are **guaranteed to match your schema**. If any variable is incorrect or missing, the app won't start and a clear error will be thrown:

```bash title="Terminal"
❯ PORT=hello npm start

ArkEnvError: Errors found while validating environment variables
  HOST must be a string or "localhost" (was missing)
  PORT must be a number (was a string)
```

## Features

- Zero external dependencies
- Works in Node.js, Bun, and Vite
- Tiny: <2kB gzipped
- Build-time and runtime validation
- Single import, zero config for most projects
- Validated, defaultable, coerced, typesafe environment variables
- Powered by ArkType, TypeScript's 1:1 validator
- Compatible with any Standard Schema validator (Zod, Valibot, etc.)
- Optimized from editor to runtime

## Installation

<details open>
<summary>npm</summary>

```sh
npm install arkenv arktype
```

</details>

<details>
<summary>pnpm</summary>

```sh
pnpm add arkenv arktype
```

</details>

<details>
<summary>Yarn</summary>

```sh
yarn add arkenv arktype
```

</details>

<details>
<summary>Bun</summary>

```sh
bun add arkenv arktype
```

</details>

:rocket: **Let's get started!** Read the [2-minute setup guide](https://arkenv.js.org/docs/quickstart) or [start with an example](https://arkenv.js.org/docs/examples).

> [!TIP]
> Improve your DX with _syntax highlighting_ in [VS Code](https://arkenv.js.org/docs/integrations/vscode), [Cursor, Antigravity](https://arkenv.js.org/docs/integrations/open-vsx), and [JetBrains IDEs](https://arkenv.js.org/docs/integrations/jetbrains).

## Requirements

ArkEnv is tested on [**Node.js LTS** and **Current**](https://github.com/yamcodes/arkenv/tree/main/examples/basic), [**Bun 1.3.2**](https://github.com/yamcodes/arkenv/tree/main/examples/with-bun), and [**Vite** from **2.9.18** to **7.x**](https://github.com/yamcodes/arkenv/tree/main/examples/with-vite-react). Older versions may work but are not officially supported.

### TypeScript setup

While ArkEnv works with plain JavaScript, _TypeScript is highly recommended_ to get the full typesafety benefits. To get ArkEnv to work with TypeScript, we require:

- [**Modern TypeScript module resolution**](https://www.typescriptlang.org/tsconfig/#moduleResolution). One of the following is required in your `tsconfig.json`:
  - `"moduleResolution": "bundler"` - Recommended for modern bundlers (Vite, Next.js, etc.). Supplied by default when using `"module": "Preserve"` (Introduced in TypeScript v5.4).
  - `"moduleResolution": "node16"` or `"nodenext"` - For Node.js projects. Supplied by default when using a matching `"module"` value.
- **TypeScript >= 5.1** and [anything else required by ArkType](https://arktype.io/docs/intro/setup#installation)

> [!NOTE]
> Without TypeScript, runtime validation still works, but you lose build-time type checking and, in some cases, editor autocomplete. Try our [examples](https://arkenv.js.org/docs/examples) to see this in action!

## Plugins

Beyond [the core package](https://arkenv.js.org/docs/arkenv), we also provide plugins for frameworks that require a specific implementation to adhere to best practices.

- [@arkenv/vite-plugin](https://arkenv.js.org/docs/vite-plugin)
- [@arkenv/bun-plugin](https://arkenv.js.org/docs/bun-plugin)

## Supporting ArkEnv

If you love ArkEnv, you can support the project by **starring it on GitHub**!

You are also welcome to [contribute to the project](https://github.com/yamcodes/arkenv/blob/main/CONTRIBUTING.md) and join the wonderful people who have contributed:

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://yam.codes"><img src="https://avatars.githubusercontent.com/u/2014360?v=4?s=100" width="100px;" alt="Yam C Borodetsky"/><br /><sub><b>Yam C Borodetsky</b></sub></a><br /><a href="https://github.com/yamcodes/arkenv/commits?author=yamcodes" title="Code">💻</a> <a href="#question-yamcodes" title="Answering Questions">💬</a> <a href="#ideas-yamcodes" title="Ideas, Planning, & Feedback">🤔</a> <a href="#design-yamcodes" title="Design">🎨</a> <a href="https://github.com/yamcodes/arkenv/commits?author=yamcodes" title="Documentation">📖</a> <a href="https://github.com/yamcodes/arkenv/issues?q=author%3Ayamcodes" title="Bug reports">🐛</a> <a href="#example-yamcodes" title="Examples">💡</a> <a href="#infra-yamcodes" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/yamcodes/arkenv/commits?author=yamcodes" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/aruaycodes"><img src="https://avatars.githubusercontent.com/u/57131628?v=4?s=100" width="100px;" alt="Aruay Berdikulova"/><br /><sub><b>Aruay Berdikulova</b></sub></a><br /><a href="https://github.com/yamcodes/arkenv/commits?author=aruaycodes" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://arktype.io"><img src="https://avatars.githubusercontent.com/u/10645823?v=4?s=100" width="100px;" alt="David Blass"/><br /><sub><b>David Blass</b></sub></a><br /><a href="#ideas-ssalbdivad" title="Ideas, Planning, & Feedback">🤔</a> <a href="#mentoring-ssalbdivad" title="Mentoring">🧑‍🏫</a> <a href="#question-ssalbdivad" title="Answering Questions">💬</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## [Acknowledgements](https://github.com/yamcodes/arkenv/blob/main/ACKNOWLEDGEMENTS.md)
