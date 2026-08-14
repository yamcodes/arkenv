---
"@arkenv/standard": minor
---

#### Add optional `toJsonSchema` for pre-coercion with Valibot and Zod Mini

Some Standard Schema libraries validate env values but do not attach JSON Schema to each field. Without that metadata, ArkEnv cannot turn `"3000"` into `3000` or `"true"` into `true` before validation — so `v.number()` and `v.boolean()` fail on ordinary env strings.

Pass `toJsonSchema` on the config object once. ArkEnv calls it only for keys that have no JSON Schema on the value. Return a plain JSON Schema object to coerce that key, or `undefined` to skip coercion for that key. If the callback throws or returns something that is not a plain object, that key fails with `ArkEnvError` (`INVALID_SCHEMA`).

**Valibot** — install `@valibot/to-json-schema` and wrap the converter. Use `typeMode: "input"` and `target: "draft-07"` (a bare function reference uses Valibot's default `typeMode: "ignore"`, which mis-coerces piped schemas). Assert `as v.GenericSchema` at the call — host converters do not accept Standard Schema:

```ts
import arkenv from "@arkenv/standard";
import * as v from "valibot";
import { toJsonSchema } from "@valibot/to-json-schema";

export const env = arkenv(
  {
    PORT: v.number(),
    DEBUG: v.boolean(),
  },
  {
    toJsonSchema: (schema) =>
      toJsonSchema(schema as v.GenericSchema, {
        typeMode: "input",
        target: "draft-07",
      }),
  },
);

// PORT=3000 DEBUG=true → env.PORT is number, env.DEBUG is boolean
```

**Zod 4.2+** — classic Zod already exposes JSON Schema on the value. Those keys coerce without `toJsonSchema`, and classic Zod never reaches the callback at runtime. You can keep the same Valibot wrapper in a mixed Valibot + Zod map.

**Zod Mini** — conversion lives on `z.toJSONSchema`, not on the value. Assert `as z.ZodMiniType` (or switch on `schema["~standard"].vendor` when mixing with Valibot):

```ts
import arkenv from "@arkenv/standard";
import * as z from "zod/mini";

export const env = arkenv(
  { PORT: z.number(), DEBUG: z.boolean() },
  {
    toJsonSchema: (schema) =>
      z.toJSONSchema(schema as z.ZodMiniType, {
        io: "input",
        target: "draft-07",
      }),
  },
);
```

The same `toJsonSchema` option is available on `@arkenv/standard` and on each framework `/standard` integration config.
