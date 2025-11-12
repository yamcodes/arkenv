> [!NOTE]
> You're viewing the `non-working-examples` branch, containing examples that are not working.
> We're using this branch to fix the examples by making ArkEnv work in web environments.

<p align="center">
  <a href="https://arkenv.js.org">
    <img alt="arkenv - Typesafe Environment Variables" src="https://og.tailgraph.com/og?titleFontFamily=JetBrains+Mono&textFontFamily=Inter&title=ArkEnv&titleTailwind=text-[%23e9eef9]%20font-bold%20relative%20decoration-%5Brgb(180,215,255)%5D%20decoration-wavy%20decoration-[5px]%20underline%20underline-offset-[16px]%20text-5xl%20mb-8&text=Typesafe%20environment%20variables%20powered%20by%20ArkType&textTailwind=text-[%238b9dc1]%20text-3xl&bgTailwind=bg-gradient-to-b%20from-[%23061a3a]%20to-black" width="645px">
  </a>
  <br />
  <a href="https://github.com/yamcodes/arkenv/actions/workflows/tests.yml?query=branch%3Amain"><img alt="Tests Status" src="https://github.com/yamcodes/arkenv/actions/workflows/tests.yml/badge.svg?event=push&branch=main"></a>
  <a href="https://bundlephobia.com/package/arkenv"><img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/arkenv"></a>
  <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white"></a>
  <a href="https://arktype.io/"><img alt="Powered By ArkType" src="https://custom-icon-badges.demolab.com/badge/ArkType-0d1526?logo=arktype2&logoColor=e9eef9"></a>
  <a href="https://nodejs.org/en"><img alt="Node.js" src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white"></a>
  <a href="https://bun.com/"><img alt="Bun" src="https://img.shields.io/badge/Bun-14151a?logo=bun&logoColor=fbf0df"></a>
  <a href="https://vite.dev/"><img alt="Vite" src="https://custom-icon-badges.demolab.com/badge/Vite-2e2742?logo=vite2&logoColor=dfdfd6"></a>
  <a href="https://discord.com/channels/957797212103016458/1415373591394127894"><img alt="Chat on Discord" src="https://img.shields.io/discord/957797212103016458?label=Chat&color=5865f4&logo=discord&labelColor=121214"></a>
</p>
<h3 align="center">Proud member of the <a href="https://arktype.io/docs/ecosystem#arkenv">ArkType ecosystem</a></h3>

<p align="center">
  <img alt="ArkEnv Demo" src="https://arkenv.js.org/assets/demo.gif" />
</p>

<br/>
<br/>
<br/>

### [Read the docs →](https://arkenv.js.org/docs)

<br/>
<br/>

## Introduction 

> [!TIP]
> 📖 **Reading this on GitHub?** Check out [this page in our docs](https://arkenv.js.org/docs) to hover over code blocks and get type hints!

ArkEnv is an environment variable parser powered by [ArkType](https://arktype.io/), TypeScript's 1:1 validator. ArkEnv lets you use familiar TypeScript-like syntax to create a ready to use, typesafe environment variable object:

```ts twoslash
import arkenv from 'arkenv';

const env = arkenv({
  HOST: "string.host", // valid IP address or localhost
  PORT: "number.port", // valid port number (0-65535)
  NODE_ENV: "'development' | 'production' | 'test'",
});

// Hover to see ✨exact✨ types
const host = env.HOST;
const port = env.PORT;
const nodeEnv = env.NODE_ENV;
```

With ArkEnv, your environment variables are **guaranteed to match your schema**. If any variable is incorrect or missing, the app won't start and a clear error will be thrown:

```
ArkEnvError: Errors found while validating environment variables
  HOST must be a string or "localhost" (was missing)
  PORT must be an integer between 0 and 65535 (was "hello")
```

## Features

- Zero external dependencies
- Works in Node.js, Bun, and Vite
- Tiny: <1kB gzipped
- Build-time and runtime validation
- Single import, zero config for most projects
- Validated, defaultable, typesafe environment variables
- Powered by ArkType, TypeScript's 1:1 validator
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
> Improve your DX with *syntax highlighting* in [VS Code & Cursor](https://arkenv.js.org/docs/integrations/vscode) or [JetBrains IDEs](https://arkenv.js.org/docs/integrations/jetbrains).

## Requirements

- TypeScript >= 5.1 and [anything else required by ArkType](https://arktype.io/docs/intro/setup#installation)
-  Tested on [Node.js **LTS** and **Current**](https://github.com/yamcodes/arkenv/tree/main/examples/basic), [Bun 1.2](https://github.com/yamcodes/arkenv/tree/main/examples/with-bun), and [Vite from **2.9.18** to **7.x**](https://github.com/yamcodes/arkenv/tree/main/examples/with-vite-react-ts). Older versions may work but are not officially supported

## Plugins

- [@arkenv/vite-plugin](https://github.com/yamcodes/arkenv/tree/main/packages/vite-plugin)

## Supporting ArkEnv

If you love ArkEnv, you can support the project by **starring it on GitHub**!

You are also welcome to directly [contribute to the project's development](https://github.com/yamcodes/arkenv/blob/main/CONTRIBUTING.md).

## [Thanks / Inspiration](https://github.com/yamcodes/arkenv/blob/main/THANKS.md)
