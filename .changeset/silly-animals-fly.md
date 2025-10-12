---
"arkenv": patch
---

#### Automatic boolean string conversion

The `boolean` type now accepts `"true"`/`"false"` strings from environment variables and converts them to actual boolean values. This also works with boolean defaults.

Example:

```ts
import arkenv from 'arkenv';

const env = arkenv({ 
  DEBUG: "boolean",
  ENABLE_FEATURE: "boolean = true"
});

console.log(env.DEBUG);
console.log(env.ENABLE_FEATURE);
```

Result:

```sh
❯ DEBUG=true npx tsx index.ts
true
true
```
