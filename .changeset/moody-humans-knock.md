---
"arkenv": patch
---

#### Object coercion

ArkEnv now coerces objects when the `coerce` option is enabled (true by default).
Objects are parsed from JSON strings, allowing for nested typesafe configuration.

Example:

```dotenv
DATABASE={"HOST": "localhost", "PORT": "5432"}
```

```ts
const env = arkenv({
  DATABASE: {
    HOST: "string",
    PORT: "number"
  }
});

console.log(env.DATABASE.PORT); // 5432 (number)
```