<p align="center">
  <sup><b>We are now featured on <a href="https://arktype.io/docs/ecosystem#arkenv">arktype.io</a>!</b></sup>
  <br />
  <a href="https://arkenv.js.org">
    <img alt="arkenv - Typesafe Environment Variables" src="https://og.tailgraph.com/og?titleFontFamily=JetBrains+Mono&textFontFamily=Inter&title=ArkEnv&titleTailwind=text-[%23e9eef9]%20font-bold%20relative%20decoration-%5Brgb(180,215,255)%5D%20decoration-wavy%20decoration-[5px]%20underline%20underline-offset-[16px]%20text-5xl%20mb-8&text=Typesafe%20environment%20variables%20powered%20by%20ArkType&textTailwind=text-[%238b9dc1]%20text-3xl&bgTailwind=bg-gradient-to-b%20from-[%23061a3a]%20to-black" width="645px">
  </a>
  <br />
  <a href="https://github.com/yamcodes/arkenv/actions/workflows/tests.yml?query=branch%3Amain"><img alt="Tests Status" src="https://github.com/yamcodes/arkenv/actions/workflows/tests.yml/badge.svg?event=push&branch=main"></a>
  <a href="https://www.npmjs.com/package/arkenv?activeTab=versions"><img alt="Total Downloads" src="https://img.shields.io/npm/dt/arkenv?logo=npm&color=blue&label=downloads"></a>
  <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white"></a>
  <a href="https://arktype.io/"><img alt="Powered By ArkType" src="https://custom-icon-badges.demolab.com/badge/ArkType-0d1526?logo=arktype2&logoColor=e9eef9"></a>
  <a href="https://nodejs.org/en"><img alt="Node.js" src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white"></a>
  <a href="https://bun.com/"><img alt="Bun" src="https://img.shields.io/badge/Bun-14151a?logo=bun&logoColor=fbf0df"></a>
  <a href="https://vite.dev/"><img alt="Vite" src="https://custom-icon-badges.demolab.com/badge/Vite-2e2742?logo=vite2&logoColor=dfdfd6"></a>
  <a href="https://github.com/yamcodes/arkenv"><img alt="GitHub Repo stars" src="https://custom-icon-badges.demolab.com/github/stars/yamcodes/arkenv?logo=star&logoColor=373737&label=Star%20us!"></a>
</p>

## Requirements

- TypeScript >= 5.1 and [anything else required by ArkType](https://arktype.io/docs/intro/setup#installation)
- We support Node.js ([example](examples/basic/README.md)), Bun ([example](examples/with-bun/README.md)), and Vite ([example](examples/with-vite-react-ts/README.md))

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

## Quickstart

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

You can find more examples in the [examples](https://github.com/yamcodes/arkenv/tree/main/examples) directory.

> [!TIP]
> **VS Code Users:** Get syntax highlighting and inline error summaries for the ArkType ecosystem with the [ArkType VS Code extension](https://marketplace.visualstudio.com/items?itemName=arktypeio.arkdark). For even better TypeScript highlighting, try [ArkThemes](https://marketplace.cursorapi.com/items/?itemName=arktypeio.arkthemes).

## Features

- 🔒 **Typesafe**: Full TypeScript support with inferred types
- 🚀 **Runtime validation**: Catch missing or invalid environment variables early
- 💪 **Powered by ArkType**: Leverage ArkType's powerful type system
- 🪶 **Lightweight**: Only a single dependency ([see size](https://bundlephobia.com/package/arkenv))
- ⚡ **Fast**: Optimized for performance with minimal overhead

## Documentation

For detailed documentation and examples, please visit our [documentation site](https://arkenv.js.org/docs).

## Plugins

- [@arkenv/vite-plugin](https://github.com/yamcodes/arkenv/tree/main/packages/vite-plugin): [Vite](https://vite.dev/) plugin to validate environment variables at build time

## Supporting ArkEnv

If you love ArkEnv, you can support the project by starring it on GitHub!

You are also welcome to directly [contribute to the project's development](https://github.com/yamcodes/arkenv/blob/main/CONTRIBUTING.md).

## Thanks / Inspiration

Find projects and people who helped or inspired the creation of ArkEnv in [THANKS.md](https://github.com/yamcodes/arkenv/blob/main/THANKS.md). Thank you 🙏
