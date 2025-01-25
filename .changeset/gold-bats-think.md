---
"ark.env": patch
---

TypeScript inference

** `ark.env` now supports TypeScript inference** - check out this quick example:

```ts
const { HOST } = defineEnv({
	HOST: "string.ip",
});
console.log(HOST); // <-- the type is "string"!
```
The above program will error out if the environment variable is set to anything other than a valid IP address.
