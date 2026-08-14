# Changeset scenarios

Copy these shapes. Swap the package name and snippet for the change in front of you.

## Bug fix (`patch`)

````markdown
---
"@arkenv/nuxt": patch
---

#### Prefer coerced env values in the Nuxt security proxy

The proxy returned raw `process.env` strings after validation had already coerced them.

```diff
  export const env = arkenv({
    PORT: "number",
  });

- env.PORT; // "3000"
+ env.PORT; // 3000
```
````

## New feature (`minor`)

````markdown
---
"@arkenv/core": minor
---

#### Add `emptyAsUndefined` so blank env keys take schema defaults

Treat `PORT=` as missing. Schema defaults then apply.

```ts
import arkenv from "@arkenv/core";

export const env = arkenv(
  { PORT: "number.port = 3000" },
  { emptyAsUndefined: true, env: { PORT: "" } },
);

env.PORT; // 3000
```
````

## Breaking change (`major`)

````markdown
---
"@arkenv/core": major
---

#### Pass `arkenv()` options as the second argument

**BREAKING CHANGE:** Move `env`, `coerce`, and related flags out of the schema object and into the second argument.

```diff
- arkenv({ PORT: "number.port", env: process.env, coerce: true });
+ arkenv({ PORT: "number.port" }, { env: process.env, coerce: true });
```
````

## Skip a changeset

No file when the diff is only:

- Internal types, refactors, or tests
- Docs site copy (`www` is ignored)
- Size-limit or lockfile churn
- Listing `@arkenv/core` only because `@arkenv/standard` changed (the `fixed` group already versions both)
