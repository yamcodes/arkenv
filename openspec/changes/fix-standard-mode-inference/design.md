# Design: Standard Mode Type Inference

## Context
`createEnv` is currently defined with several overloads. The most common one is:

```ts
export function createEnv<const T extends SchemaShape>(
	def: EnvSchema<T>,
	config?: ArkEnvConfig,
): distill.Out<at.infer<T, $>>;
```

`EnvSchema<T>` is defined as `at.validate<def, $>`. This is an ArkType-specific type that ensures the definition is valid for ArkType.

When `config.validator` is `"standard"`, we want a completely different signature.

## Proposed Overloads

We should split the overloads based on the `validator` property in `ArkEnvConfig`.

### 1. Standard Mode Overload
When `validator` is explicitly `"standard"`.

```ts
export function createEnv<const T extends Record<string, StandardSchemaV1>>(
	def: T,
	config: ArkEnvConfig & { validator: "standard" },
): { [K in keyof T]: StandardSchemaV1.InferOutput<T[K]> };
```

### 2. ArkType Mode Overload
When `validator` is `"arktype"` or omitted.

```ts
export function createEnv<const T extends SchemaShape>(
	def: EnvSchema<T>,
	config?: ArkEnvConfig & { validator?: "arktype" },
): distill.Out<at.infer<T, $>>;
```

## Complexity: Optional Config
The main challenge is that `config` is optional. If it's omitted, it defaults to ArkType mode.

If `config` is omitted, `validator: "standard"` is definitely not there, so it should fall back to ArkType.

## Implementation Details

### Handling `at.validate` and `distill.Out`
If ArkType is NOT installed, these types will error. However, since `arktype` is a peer dependency of `arkenv`, it's usually present in the environment where `arkenv` is used for development, even if the user wants to avoid it at runtime.

Wait, if the user explicitly wants to use ArkEnv *without* ArkType, they might not even have it in `devDependencies`. In that case, `arkenv`'s own source code will fail to compile if it imports from `arktype`.

However, `arkenv` is a library. Its types are shipped in `dist/`.

When a user uses `arkenv`:
- If they have `validator: "standard"`, they shouldn't need `arktype` types.
- If they DON'T have `arktype` installed, but `arkenv` exports types that depend on `arktype`, they might get errors from their build tool (like `tsc`) saying `arktype` not found.

To solve this properly, we might need to make the ArkType-specific return types conditional or use a "soft" version of them that doesn't hard-fail if `arktype` is missing (but typically, if you're using ArkType mode, you MUST have it).

Actually, the user said: "it obviously happens because the return types of createEnv are all arktype based, but in recent changes we've made it so that arktype is not required anymore."

If `arktype` is not required, then `arkenv` types must be usable without it.

Let's look at how `EnvSchema` is defined in `packages/arkenv/src/create-env.ts`:
```ts
export type EnvSchema<def> = at.validate<def, $>;
```

If we want this to be "soft", we can do something like:
```ts
export type EnvSchema<def> = at extends never ? def : at.validate<def, $>;
```
But `at` is an import.

Instead, we can use a helper type that checks if `at.validate` is available.

Actually, the easiest way to fix the inference specifically for Standard mode is to ensure the Standard mode overload comes first and is specific enough.

### Overload Order
The TypeScript compiler picks the first matching overload.

```ts
// 1. Standard Mode (Strict config)
export function createEnv<const T extends Record<string, StandardSchemaV1>>(
	def: T,
	config: ArkEnvConfig & { validator: "standard" },
): { [K in keyof T]: StandardSchemaV1.InferOutput<T[K]> };

// 2. ArkType Mode (Default or explicit)
export function createEnv<const T extends SchemaShape>(
	def: EnvSchema<T>,
	config?: ArkEnvConfig & { validator?: "arktype" },
): distill.Out<at.infer<T, $>>;
```

Wait, `EnvSchema<T>` might match a Standard Schema object too (since it's `Record<string, unknown>`-ish).

We need to make sure `EnvSchema<T>` doesn't swallow Standard Schema objects if `validator: "standard"` is passed.

## Standard Schema Inference Refinement
Standard Schema 1.0 requires `~standard` property. 
We can use this to differentiate.

```ts
type StandardSchemaShape = Record<string, StandardSchemaV1>;

type InferredStandard<T extends StandardSchemaShape> = {
    [K in keyof T]: StandardSchemaV1.InferOutput<T[K]>
};
```
