<div align="center">
<div style="font-size: 48px">🌿</div>
<h1>ark.env</h1>

<p>Type-safe environment variables parsing and validation for Node.js with ArkType</p>

## Installation

```bash
# Using bun
bun add ark.env

# Using npm
npm install ark.env

# Using yarn
yarn add ark.env

# Using pnpm
pnpm add ark.env
```

</div>

## Quick Start

```typescript
import { createEnv } from 'ark.env'

const env = createEnv({
  PORT: 'number',
  DATABASE_URL: 'string',
  NODE_ENV: ['development', 'production', 'test']
})

// Automatically validates and parses process.env
// TypeScript knows the exact types!
console.log(env.PORT) // number
console.log(env.NODE_ENV) // 'development' | 'production' | 'test'
```

## Features

- 🔒 **Type-safe**: Full TypeScript support with inferred types
- 🚀 **Runtime validation**: Catches missing or invalid environment variables early
- 💪 **Powered by ArkType**: Leverages ArkType's powerful type system
- 🪶 **Lightweight**: Zero dependencies, minimal bundle size
- ⚡ **Fast**: Optimized for performance with minimal overhead

## Documentation

For detailed documentation and examples, visit our [documentation site](https://github.com/username/ark.env/docs).

## License

MIT
