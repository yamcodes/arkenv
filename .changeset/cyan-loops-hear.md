---
"arkenv": patch
---

#### Native Coercion Support

Added native support for coercion in the `createEnv` (`arkenv`) and `type` functions. In practice, this adds automatic type conversions for the `number` keyword (and its sub-keywords).

Now, you can define a `number` directly:

```ts
const env = arkenv({
	PORT: "number",
  EPOCH: "number.epoch",
  BOOLEAN: "boolean",
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
