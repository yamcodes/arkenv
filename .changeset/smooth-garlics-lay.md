---
"arkenv": patch
---

#### Array coercion

ArkEnv now coerces arrays when the `coerce` option is enabled (true by default).
Arrays are parsed using trimmed, comma separated values.

Example:

```dotenv
MY_ARRAY=one,two,three
```

```ts
const env = arkenv({
	MY_ARRAY: "string[]",
});

console.log(env.MY_ARRAY); // ["one", "two", "three"]
```
