<img src="assets/banner.png" alt="ark.env">

## Installation

<details open>
<summary>npm</summary>

```sh
npm install ark.env
```
</details>

<details>
<summary>pnpm</summary>

```sh
pnpm add ark.env
```
</details>

<details>
<summary>Yarn</summary>

```sh
yarn add ark.env
```
</details>

<details>
<summary>Bun</summary>

```sh
bun add ark.env
```
</details>

## Quickstart

> [!TIP]
> For comprehensive usage examples, please see [src/sample.ts](./src/sample.ts).

```ts
import { defineEnv, host, port } from 'ark.env';

const env = defineEnv({
  HOST: host, // validate IP addresses and 'localhost'
  PORT: port, // validate port numbers (0-65535)
  NODE_ENV: "'development' | 'production' | 'test'", // validate string union
});

// Automatically validate and parse process.env
// TypeScript knows the ✨exact✨ types!
console.log(env.HOST); // (property) HOST: string
console.log(env.PORT); // (property) PORT: number
console.log(env.NODE_ENV); // (property) NODE_ENV: "development" | "production" | "test"
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

For detailed documentation and examples, visit our [documentation site](https://http.cat/503).

## Thanks / Inspiration

Find projects and people who helped or inspired this project in [THANKS.md](./THANKS.md). Thank you 🙏
