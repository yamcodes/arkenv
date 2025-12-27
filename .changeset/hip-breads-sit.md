---
"arkenv": patch
---

#### Strip undeclared keys from output by default

Environment variables not defined in your schema are now stripped from the output object by default.  

You can customize this behavior using the new `onUndeclaredKey` option.

For example, assuming this is your `.env` file:

```env
MY_VAR=hello
UNDECLARED_VAR=world
```

And this is your schema:

```ts
const env = arkenv({
	MY_VAR: type.string(),
});

console.log(env);
```

Current output:

```ts
{
	MY_VAR: "hello"
}
```

Previous output:

```ts
{
	MY_VAR: "hello",
	UNDECLARED_VAR: "world"
}
```
