---
"arkenv": minor
---

#### Native Coercion Support

Added native support for coercion in the `createEnv` (`arkenv`) and `type` functions. In practice, this adds automatic type conversions for the `number` keyword (and its sub-keywords).

- **BREAKING**: ArkEnv now uses a scope that enables automatic string coercion for `number` and `boolean`. This means `number` is now a Morph type, which does not support ranges, divisors, and number literals with coercion. See "Known Limitations" for workarounds.

Now, you can define a `number` directly:

```ts
const env = arkenv({
	PORT: "number",
  EPOCH: "number.epoch",
});
```

```dotenv
PORT=3000
EPOCH=1678886400000
BOOLEAN=true
```

and it will be coerced to the desired types.

```ts
env.PORT // 3000
env.EPOCH // 1678886400000
env.BOOLEAN // true
```

#### Known Limitations
- Applying range bounds (e.g., `type("0 <= number <= 100")`) or divisors (e.g., `type("number % 5")`) directly to the coerced `number` keyword is currently not supported and will throw a `ParseError` due to how these constraints interact with Morphs.
  - **Workaround**: Chain a constrained type using standard `arktype` definitions:
```ts
import { type as at } from "arktype";

// Validation with bounds
const port = type("number").to(at("0 <= number <= 65535"));

// Validation with divisors
const div = type("number").to(at("number % 5"));

// Coercion to specific literals (accepts "1" -> 1)
const onOff = type("number").to(at("0 | 1")); 
```
- **Note**: Strict number literals (e.g., `type("1 | 2")`) continue to work as expected but will **not** coerce strings by default. To coerce strings to literals, use the workaround above.
