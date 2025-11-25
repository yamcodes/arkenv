# `@arkenv/bun-plugin`

[Bun](https://bun.sh/) plugin to validate environment variables at build-time with ArkEnv.

<br/>
<br/>
<br/>

## [Read the docs →](https://arkenv.js.org/docs/bun-plugin)

<br/>
<br/>

## Features

- Build-time validation - app won't start if environment variables are invalid
- Typesafe environment variables backed by TypeScript
- Access to ArkType's powerful type system
- Automatic filtering of client-exposed variables (defaults to `BUN_PUBLIC_*`)

## Installation

<details open>
<summary>pnpm</summary>

```sh
pnpm add @arkenv/bun-plugin arktype
```
</details>

<details>
<summary>npm</summary>

```sh
npm install @arkenv/bun-plugin arktype
```
</details>

<details>
<summary>Yarn</summary>

```sh
yarn add @arkenv/bun-plugin arktype
```
</details>

<details>
<summary>Bun</summary>

```sh
bun add @arkenv/bun-plugin arktype
```
</details>

## Usage

### Basic Example

```ts
// bun.config.ts or in Bun.build()
import arkenv from '@arkenv/bun-plugin';

await Bun.build({
  entrypoints: ['./app.tsx'],
  outdir: './dist',
  plugins: [
    arkenv({
      BUN_PUBLIC_API_URL: 'string',
      BUN_PUBLIC_DEBUG: 'boolean',
    }),
  ],
});
```

### With Type Augmentation

```ts
// src/env.d.ts
/// <reference types="bun-types" />

import type { ProcessEnvAugmented } from '@arkenv/bun-plugin';
import type { Env } from './env'; // or from bun.config.ts

declare global {
  namespace NodeJS {
    interface ProcessEnv extends ProcessEnvAugmented<typeof Env> {}
  }
}
```

## Examples

* [bun-react](https://github.com/yamcodes/arkenv/tree/main/apps/playgrounds/bun-react)

## Related

- [ArkEnv](https://arkenv.js.org) - Core library and docs
- [ArkType](https://arktype.io/) - Underlying validator / type system
