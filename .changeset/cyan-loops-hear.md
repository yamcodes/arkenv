---
"arkenv": minor
---

#### Coercion

Added coercion in the `createEnv` (`arkenv`) functions for `number` and `boolean` types. Since we had a custom `boolean` keyword prior to this change, in practice, **this adds automatic type conversions for the `number` keyword (and its sub-keywords).**

Now, you can define a `number` directly:

```ts
const env = arkenv({
  PORT: "number",
  RANGE: "0 <= number <= 18",
  EPOCH: "number.epoch",
});
```

```dotenv
PORT=3000
EPOCH=1678886400000
BOOLEAN=true
RANGE=18
```

and it will be coerced to the desired types.

```ts
env.PORT // 3000
env.EPOCH // 1678886400000
env.BOOLEAN // true
env.RANGE // 18
```

* **BREAKING**: The `number.port` keyword has been simplified and no longer automatically parses strings to numbers. For most use cases (through `createEnv` / `arkenv`), this should not make a difference, since string -> number coercion is still done (at the global level).

```ts
const env = arkenv({
  PORT: "number.port",
});

env.PORT // 3000 (number)
```

```dotenv
PORT="3000"
```

