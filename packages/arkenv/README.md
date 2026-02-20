<p align="center">
  <a href="https://github.com/yamcodes/arkenv/blob/main/apps/www/public/assets/icon.svg"><img alt="ArkEnv Logo" src="https://arkenv.js.org/assets/icon.svg" width="160px" align="center"/></a>
  <h1 align="center">ArkEnv</h1>
  <div align="center">
    <p align="center">Environment variable validation from editor to runtime</p>
    <a href="https://github.com/yamcodes/arkenv/actions/workflows/test.yml?query=branch%3Amain"><img alt="Test Status" src="https://github.com/yamcodes/arkenv/actions/workflows/tests-badge.yml/badge.svg?branch=main"></a>
    <a href="https://bundlephobia.com/package/arkenv"><img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/arkenv"></a>
    <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white"></a>
    <a href="https://arktype.io/"><img alt="Powered By ArkType" src="https://custom-icon-badges.demolab.com/badge/ArkType-0d1526?logo=arktype2&logoColor=e9eef9"></a>
    <a href="https://nodejs.org/en"><img alt="Node.js" src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white"></a>
    <a href="https://bun.com/"><img alt="Bun" src="https://img.shields.io/badge/Bun-14151a?logo=bun&logoColor=fbf0df"></a>
    <a href="https://vite.dev/"><img alt="Vite" src="https://custom-icon-badges.demolab.com/badge/Vite-2e2742?logo=vite2&logoColor=dfdfd6"></a>
    <a href="https://discord.gg/zAmUyuxXH9"><img alt="Chat on Discord" src="https://img.shields.io/discord/957797212103016458?label=Chat&color=5865f4&logo=discord&labelColor=121214"></a>
  </div>
</p>
<h3 align="center">Proud part of the <a href="https://arktype.io/docs/ecosystem#arkenv">ArkType ecosystem</a></h3>

<p align="center">
  <img alt="ArkEnv Demo" src="https://arkenv.js.org/assets/demo.gif" />
</p>

<br/>
<br/>
<br/>

### [Read the docs →](https://arkenv.js.org/docs/arkenv)

<br/>
<br/>

## What is ArkEnv?

ArkEnv is an environment variable validator for modern JavaScript runtimes. It creates a ready-to-use, typesafe environment variable object:

```ts
import arkenv from "arkenv";

const env = arkenv({
  HOST: "string.ip | 'localhost'",
  PORT: "0 <= number.integer <= 65535",
  NODE_ENV: "'development' | 'production' | 'test' = 'development'",
  DEBUGGING: "boolean = false",
});
```

> ArkEnv defaults to [ArkType](https://arktype.io/) notation, the closest match to TypeScript syntax for editor-to-runtime typesafety. You can also use any [Standard Schema](https://standardschema.dev/schema) validator, including Zod, Valibot, and Typia.

With ArkEnv, your environment variables are **guaranteed to match your schema**. If any variable is incorrect or missing, the app won't start and a clear error will be thrown:

```bash title="Terminal"
❯ PORT=hello npm start

ArkEnvError: Errors found while validating environment variables
  HOST must be a string or "localhost" (was missing)
  PORT must be a number (was a string)
```

## Features

* Zero external dependencies
* Works in Node.js, Bun, and Vite
* Tiny: <3kB gzipped 
* Build-time / runtime validation with editor autocomplete & type hints
* Single import, zero config for most projects
* Optional variables and default values
* Intuitive automatic coercion
* Compatible with any Standard Schema validator (Zod, Valibot, etc.)
* Native support for ArkType, TypeScript's 1\:1 validator

> See how ArkEnv compares to alternatives like T3 Env, znv, and envalid in the [comparison cheatsheet](https://arkenv.js.org/docs/arkenv/comparison#comparison-cheatsheet).

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

> Improve your DX with _syntax highlighting_ in [VS Code](https://arkenv.js.org/docs/arkenv/integrations/api/vscode), [Cursor, Antigravity](https://arkenv.js.org/docs/arkenv/integrations/api/open-vsx), and [JetBrains IDEs](https://arkenv.js.org/docs/arkenv/integrations/api/jetbrains).

## Requirements

ArkEnv is tested on [**Node.js LTS** and **Current**](https://github.com/yamcodes/arkenv/tree/main/examples/basic), [**Bun 1.3.2**](https://github.com/yamcodes/arkenv/tree/main/examples/with-bun), and [**Vite** from **2.9.18** to **7.x**](https://github.com/yamcodes/arkenv/tree/main/examples/with-vite-react). Older versions may work but are not officially supported.

### TypeScript requirements

- [**Modern TypeScript module resolution**](https://www.typescriptlang.org/tsconfig/#moduleResolution). One of the following is required in your `tsconfig.json`:
  - `"moduleResolution": "bundler"` - Recommended for modern bundlers (Vite, Next.js, etc.). Supplied by default when using `"module": "Preserve"` (Introduced in TypeScript v5.4).
  - `"moduleResolution": "node16"` or `"nodenext"` - For Node.js projects. Supplied by default when using a matching `"module"` value.
- **TypeScript >= 5.1** and [anything else required by ArkType](https://arktype.io/docs/intro/setup#installation)

> While TypeScript is the recommended setup, ArkEnv works with plain JavaScript. See the [basic-js](https://github.com/yamcodes/arkenv/tree/main/examples/basic-js) example for details and tradeoffs.

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
      <td align="center" valign="top" width="14.28%"><a href="https://yam.codes"><img src="https://avatars.githubusercontent.com/u/2014360?v=4?s=100" width="100px;" alt="Yam C Borodetsky"/><br /><sub><b>Yam C Borodetsky</b></sub></a><br /><a href="#code-yamcodes" title="Code">💻</a> <a href="#question-yamcodes" title="Answering Questions">💬</a> <a href="#ideas-yamcodes" title="Ideas, Planning, & Feedback">🤔</a> <a href="#design-yamcodes" title="Design">🎨</a> <a href="#doc-yamcodes" title="Documentation">📖</a> <a href="#bug-yamcodes" title="Bug reports">🐛</a> <a href="#example-yamcodes" title="Examples">💡</a> <a href="#infra-yamcodes" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#test-yamcodes" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/aruaycodes"><img src="https://avatars.githubusercontent.com/u/57131628?v=4?s=100" width="100px;" alt="Aruay Berdikulova"/><br /><sub><b>Aruay Berdikulova</b></sub></a><br /><a href="#code-aruaycodes" title="Code">💻</a> <a href="#ideas-aruaycodes" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://arktype.io"><img src="https://avatars.githubusercontent.com/u/10645823?v=4?s=100" width="100px;" alt="David Blass"/><br /><sub><b>David Blass</b></sub></a><br /><a href="#ideas-ssalbdivad" title="Ideas, Planning, & Feedback">🤔</a> <a href="#mentoring-ssalbdivad" title="Mentoring">🧑‍🏫</a> <a href="#question-ssalbdivad" title="Answering Questions">💬</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/danciudev"><img src="https://avatars.githubusercontent.com/u/44430251?v=4?s=100" width="100px;" alt="Andrei Danciu"/><br /><sub><b>Andrei Danciu</b></sub></a><br /><a href="#code-danciudev" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://joakim.beng.se"><img src="https://avatars.githubusercontent.com/u/1427383?v=4?s=100" width="100px;" alt="Joakim Carlstein"/><br /><sub><b>Joakim Carlstein</b></sub></a><br /><a href="#code-joakimbeng" title="Code">💻</a> <a href="#doc-joakimbeng" title="Documentation">📖</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## [Acknowledgements](https://github.com/yamcodes/arkenv/blob/main/ACKNOWLEDGEMENTS.md)
