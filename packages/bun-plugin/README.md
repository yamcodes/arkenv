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

> [!IMPORTANT]
> This plugin requires `arktype` to be installed in your project.
>
> It does not support `validator: "standard"`.
> You can still use Zod or Valibot schemas alongside ArkType's DSL, since ArkType natively supports Standard Schema.
>
> See the [docs](https://arkenv.js.org/docs/arkenv/integrations/standard-schema) for details.

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

### Simple Setup (Auto-discover schema)

Create your schema in `src/env.ts`:

```ts
// src/env.ts
import { type } from 'arkenv';

export default type({
  BUN_PUBLIC_API_URL: 'string',
  BUN_PUBLIC_DEBUG: 'boolean',
});
```

Configure for `bun serve` in `bunfig.toml`:

```toml
[serve.static]
plugins = ["@arkenv/bun-plugin"]
```

Configure for `Bun.build` in your build script:

```ts
// build.ts
import arkenv from '@arkenv/bun-plugin';

await Bun.build({
  entrypoints: ['./app.tsx'],
  outdir: './dist',
  plugins: [arkenv], // Auto-discovers src/env.ts
});
```

### Advanced Setup

Pass your schema directly to the plugin:

```ts
// build.ts
import arkenv from '@arkenv/bun-plugin';
import { type } from 'arkenv';

await Bun.build({
  entrypoints: ['./app.tsx'],
  outdir: './dist',
  plugins: [
    arkenv(type({
      BUN_PUBLIC_API_URL: 'string',
      BUN_PUBLIC_DEBUG: 'boolean',
    })),
  ],
});
```

### With Type Augmentation

```ts
// src/env.d.ts
/// <reference types="bun-types" />

import type { ProcessEnvAugmented } from '@arkenv/bun-plugin';

declare global {
  namespace NodeJS {
    // Note: This assumes your env schema is the default export from "./env"
    interface ProcessEnv extends ProcessEnvAugmented<typeof import("./env").default> {}
  }
}
```

## Examples

* [bun-react](https://github.com/yamcodes/arkenv/tree/main/apps/playgrounds/bun-react)

## Related

- [ArkEnv](https://arkenv.js.org) - Core library and docs
- [ArkType](https://arktype.io/) - Underlying validator / type system
