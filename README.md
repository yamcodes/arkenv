<img src="assets/banner.png" alt="ark.env">

## Installation

<details open>
<summary>Using npm</summary>

```sh
npm install ark.env
```
</details>

<details>
<summary>Using pnpm</summary>

```sh
pnpm add ark.env
```
</details>

<details>
<summary>Using yarn</summary>

```sh
yarn add ark.env
```
</details>

<details>
<summary>Using bun</summary>

```sh
bun add ark.env
```
</details>

## Quick Start

> [!IMPORTANT]
> This section is not yet complete and is likely inaccurate. For usage example, please see [src/sample/index.ts](./src/sample/index.ts).

```ts
import { createEnv } from 'ark.env';

const env = createEnv({
  PORT: 'number',
  DATABASE_URL: 'string',
  NODE_ENV: ['development', 'production', 'test']
});

// Automatically validates and parses process.env
// TypeScript knows the exact types!
console.log(env.PORT); // number
console.log(env.NODE_ENV); // 'development' | 'production' | 'test'
```

## Features

- 🔒 **Type-safe**: Full TypeScript support with inferred types
- 🚀 **Runtime validation**: Catch missing or invalid environment variables early
- 💪 **Powered by ArkType**: Leverage ArkType's powerful type system
- 🪶 **Lightweight**: Zero dependencies, minimal bundle size
- ⚡ **Fast**: Optimized for performance with minimal overhead

## Documentation

> [!NOTE]
> Our documentation site is still under construction. Please check back soon!

For detailed documentation and examples, visit our [documentation site](https://github.com/yamcodes/ark.env/docs).

## Thanks / Inspiration

Find projects and people who helped or inspired this project in [THANKS.md](./THANKS.md). Thank you 🙏
