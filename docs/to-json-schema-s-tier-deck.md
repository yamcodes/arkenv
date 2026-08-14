# Two ways to wire Valibot into ArkEnv

A tiny deck for comparing the two “S-tier” options.  
Same feature either way — only the **typing story** differs.

Each example is a full file you’d put in a real app (e.g. `src/env.ts`).

---

## The situation (30 seconds)

ArkEnv turns env strings like `"3000"` into real numbers.

- **Zod** already tells ArkEnv how (JSON Schema on the schema itself).
- **Valibot** keeps that converter in a *separate* function.

So Valibot users pass a small callback. The debate is only:

> What type is `schema` inside that callback — and when do you write `as …`?

---

## Same starting project

Imagine a small Node app. One env file:

```text
my-app/
  src/
    env.ts      ← the file we compare below
  package.json
```

Both contenders change **only** what that `src/env.ts` looks like.

---

## Case 1 — Valibot only (the everyday happy path)

### Contender A — Smart types · `src/env.ts`

No `as`. ArkEnv has already narrowed `schema` to Valibot.

```ts
// src/env.ts
import arkenv from "@arkenv/standard";
import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";

export const env = arkenv(
  {
    PORT: v.number(),
    DEBUG: v.boolean(),
  },
  {
    toJsonSchema: (schema) =>
      toJsonSchema(schema, {
        typeMode: "input",
        target: "draft-07",
      }),
  },
);
```

### Contender B — Always assert · `src/env.ts`

Same file, but you always write `as v.GenericSchema`.

```ts
// src/env.ts
import arkenv from "@arkenv/standard";
import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";

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
```

**Diff that matters:** one line — `schema` vs `schema as v.GenericSchema`.

---

## Case 2 — You later add classic Zod

Same app. You add `HOST` with Zod. Path still `src/env.ts`.

### Contender A — Smart types · `src/env.ts`

Still **no** `as`. Zod never reaches the callback, so the Valibot line stays clean.

```ts
// src/env.ts
import arkenv from "@arkenv/standard";
import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";
import { z } from "zod";

export const env = arkenv(
  {
    HOST: z.string(),
    PORT: v.number(),
    DEBUG: v.boolean(),
  },
  {
    toJsonSchema: (schema) =>
      toJsonSchema(schema, {
        typeMode: "input",
        target: "draft-07",
      }),
  },
);
```

### Contender B — Always assert · `src/env.ts`

Still the **same** `as`. Adding Zod did not change the Valibot line.

```ts
// src/env.ts
import arkenv from "@arkenv/standard";
import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";
import { z } from "zod";

export const env = arkenv(
  {
    HOST: z.string(),
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
```

**Shared win:** neither contender suddenly “taxes” you for adding Zod.  
**Difference:** A never had the cast; B always did.

---

## Case 3 — Valibot + Zod Mini (the awkward mix)

Same path: `src/env.ts`. Both libraries miss JSON Schema on the value, so you switch on vendor.

### Contender A — Smart types · `src/env.ts`

Here A **also** needs `as` — this is the “wait, when?” moment.

```ts
// src/env.ts
import arkenv from "@arkenv/standard";
import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";
import * as z from "zod/mini";

export const env = arkenv(
  {
    PORT: v.number(),
    DEBUG: z.boolean(),
  },
  {
    toJsonSchema: (schema) => {
      switch (schema["~standard"].vendor) {
        case "valibot":
          return toJsonSchema(schema as v.GenericSchema, {
            typeMode: "input",
            target: "draft-07",
          });
        case "zod":
          return z.toJSONSchema(schema as z.ZodMiniType, {
            io: "input",
            target: "draft-07",
          });
        default:
          return undefined;
      }
    },
  },
);
```

### Contender B — Always assert · `src/env.ts`

Looks almost the same — but you were already expecting `as` from Case 1.

```ts
// src/env.ts
import arkenv from "@arkenv/standard";
import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";
import * as z from "zod/mini";

export const env = arkenv(
  {
    PORT: v.number(),
    DEBUG: z.boolean(),
  },
  {
    toJsonSchema: (schema) => {
      switch (schema["~standard"].vendor) {
        case "valibot":
          return toJsonSchema(schema as v.GenericSchema, {
            typeMode: "input",
            target: "draft-07",
          });
        case "zod":
          return z.toJSONSchema(schema as z.ZodMiniType, {
            io: "input",
            target: "draft-07",
          });
        default:
          return undefined;
      }
    },
  },
);
```

**Diff that matters:** not the mix file — it’s whether Case 1 trained you that `as` is normal.

---

## Side by side

| | Smart types (A) | Always assert (B) |
| --- | --- | --- |
| File | always `src/env.ts` | always `src/env.ts` |
| Valibot only | no `as` | `as` |
| Add Zod later | still no `as` | still `as` (unchanged) |
| Mix Valibot + Mini | `as` appears | `as` (already expected) |
| Mental model | “Cast when the map needs it” | “Cast when you call that converter” |

---

## The key difference (one line)

**A** optimizes for fewer casts.  
**B** optimizes for **never surprising** the person reading `src/env.ts`.

The painful case both want to avoid is not “having an `as`” —  
it’s “I added Zod and suddenly TypeScript made me cast Valibot.”

- **A** avoids that by being clever about which schemas reach the callback.
- **B** avoids that by making the cast a constant of calling Valibot’s converter — Zod never changes the story.

---

## If you only remember one thing

Same product. Same file path. Same runtime.

| | |
| --- | --- |
| **A — Smart** | `src/env.ts` stays cast-free until a weird mix. |
| **B — Always assert** | `src/env.ts` always names the converter at the door. |
