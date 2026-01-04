---
"arkenv": patch
---

#### Array coercion

ArkEnv now coerces arrays when the `coerce` option is enabled (true by default).
Arrays are parsed using trimmed, comma separated values by default.

You can customize this behavior with the `arrayFormat` option:
- `comma` (default): Strings are split by comma and trimmed.
- `json`: Strings are parsed as JSON.

Example:

```dotenv
MY_ARRAY=one,two,three
MY_JSON_ARRAY=["a", "b"]
```

```ts
const env = arkenv({
	MY_ARRAY: "string[]",
    MY_JSON_ARRAY: "string[]"
}, {
    // optional, 'comma' is default
    arrayFormat: 'comma'
});

console.log(env.MY_ARRAY); // ["one", "two", "three"]
```
