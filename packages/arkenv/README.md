<p align="center">
  <a href="https://arkenv.js.org">
    <img alt="arkenv - Typesafe Environment Variables" src="https://og.tailgraph.com/og?titleFontFamily=JetBrains+Mono&textFontFamily=Inter&title=ArkEnv&titleTailwind=text-[%23e9eef9]%20font-bold%20relative%20decoration-%5Brgb(180,215,255)%5D%20decoration-wavy%20decoration-[5px]%20underline%20underline-offset-[16px]%20text-5xl%20mb-8&text=Typesafe%20environment%20variables%20powered%20by%20ArkType&textTailwind=text-[%238b9dc1]%20text-3xl&bgTailwind=bg-gradient-to-b%20from-[%23061a3a]%20to-black" width="645px">
  </a>
  <br />
  <a href="https://github.com/yamcodes/arkenv/actions/workflows/tests.yml?query=branch%3Amain"><img alt="Tests Status" src="https://github.com/yamcodes/arkenv/actions/workflows/tests.yml/badge.svg?event=push&branch=main"></a>
  <a href="https://discord.com/channels/957797212103016458/1415373591394127894"><img alt="Chat on Discord" src="https://img.shields.io/discord/957797212103016458?label=Chat&color=5865f4&logo=discord&labelColor=121214"></a>
  <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white"></a>
  <a href="https://arktype.io/"><img alt="Powered By ArkType" src="https://custom-icon-badges.demolab.com/badge/ArkType-0d1526?logo=arktype2&logoColor=e9eef9"></a>
  <a href="https://nodejs.org/en"><img alt="Node.js" src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white"></a>
  <a href="https://bun.com/"><img alt="Bun" src="https://img.shields.io/badge/Bun-14151a?logo=bun&logoColor=fbf0df"></a>
  <a href="https://vite.dev/"><img alt="Vite" src="https://custom-icon-badges.demolab.com/badge/Vite-2e2742?logo=vite2&logoColor=dfdfd6"></a>
  <a href="https://github.com/yamcodes/arkenv"><img alt="GitHub Repo stars" src="https://custom-icon-badges.demolab.com/github/stars/yamcodes/arkenv?logo=star&logoColor=373737&label=Star%20us!&"></a>
  <h3 align="center">Proud member of the <a href="https://arktype.io/docs/ecosystem#arkenv">ArkType ecosystem</a></h3>
</p>

<br/>
<br/>
<br/>

### [Read the docs →](https://arkenv.js.org/docs)

<br/>
<br/>

## Introduction


ArkEnv is an environment variable parser built on top of [ArkType](https://arktype.io/), TypeScript's 1:1 validator. ArkEnv lets you use familiar TypeScript-like syntax to create a ready to use, typesafe environment variable object:


```ts
import arkenv from 'arkenv';

const env = arkenv({
  HOST: "string.host", // valid IP address or localhost
  PORT: "number.port", // valid port number (0-65535)
  NODE_ENV: "'development' | 'production' | 'test'",
});


// Automatically validate and parse process.env
// TypeScript knows the ✨exact✨ types!
console.log(env.HOST);     // (property) HOST: string
console.log(env.PORT);     // (property) PORT: number
console.log(env.NODE_ENV); // (property) NODE_ENV: "development" | "production" | "test"
```

## Features

- Zero external dependencies
- Works in [Node.js](https://github.com/yamcodes/arkenv/tree/main/examples/basic), [Bun](https://github.com/yamcodes/arkenv/tree/main/examples/with-bun), and [Vite](https://github.com/yamcodes/arkenv/tree/main/examples/with-vite-react-ts)
- Tiny: <1kB ([gzipped](https://bundlephobia.com/package/arkenv))
- [Build-time](https://github.com/yamcodes/arkenv/tree/main/examples/with-vite-react-ts) and [runtime](https://github.com/yamcodes/arkenv/tree/main/examples/basic) validation
- Single import, zero config for most projects
- [Powered by ArkType](https://arktype.io/docs/ecosystem#arkenv), TypeScript's 1:1 validator

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
> **VS Code Users:** Get syntax highlighting and inline error summaries for the ArkType ecosystem with the [ArkType VS Code extension](https://marketplace.visualstudio.com/items?itemName=arktypeio.arkdark). Step-by-step guide [here](https://arkenv.js.org/docs/guides/import-options).
> 
> ![ArkType syntax highlighting in VS Code](https://raw.githubusercontent.com/yamcodes/arkenv/main/assets/dx.png)

## Requirements

- TypeScript >= 5.1 and [anything else required by ArkType](https://arktype.io/docs/intro/setup#installation)

## Plugins

- [@arkenv/vite-plugin](https://github.com/yamcodes/arkenv/tree/main/packages/vite-plugin): [Vite](https://vite.dev/) plugin to validate environment variables at build time

## Supporting ArkEnv

If you love ArkEnv, you can support the project by starring it on GitHub!

You are also welcome to directly [contribute to the project's development](https://github.com/yamcodes/arkenv/blob/main/CONTRIBUTING.md).

## [Thanks / Inspiration](https://github.com/yamcodes/arkenv/blob/main/THANKS.md)
