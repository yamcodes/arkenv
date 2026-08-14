# Wiring off-value JSON Schema converters

Living evaluation, not an ADR. Update this file as options enter or leave the hat. Promoted decisions belong in `docs/adr/` (related: [0002](./adr/0002-coercion-schema-transformer.md), [0007](./adr/0007-standard-mode-packaging-strategy.md), [0018](./adr/0018-cli-hosting-preset-field-metadata.md)).

**Status:** working note for `#1564` / PR `#1570`. **Chosen public story: B6 (always-`as`)** — callback is `StandardSchemaV1`; assert at every host-converter call. B5 (`ToJsonSchemaInput`) was evaluated and declined for teachability.

## Problem

`@arkenv/standard` pre-coerces from **JSON Schema on the value**. Some libraries put it there (classic Zod). Others keep conversion in a **standalone function** (Valibot’s `@valibot/to-json-schema`, Zod Mini’s `z.toJSONSchema`).

Users need those off-value converters wired in so `v.number()` / Mini `z.boolean()` coerce like Zod, without:

1. wrapping every key (`toStandardJsonSchema(...)`)
2. giving up ArkEnv coercion (`v.transform(Number)`)
3. lying in the types (`any`, or typing Zod into a callback it never reaches)
4. paying a Valibot tax for adding Zod
5. stuffing converter options into every schema map
6. taking a Valibot/Mini peer on `@arkenv/standard` (ADR 0007)

The awkward bit is a **type boundary**: ArkEnv hands a Standard Schema; host converters do not accept that type; `vendor` does not narrow Mini vs Valibot; Valibot’s bare function uses `typeMode: "ignore"`.

Two layers of solution exist. They compose.

- **Typing:** what is `schema` in `toJsonSchema: (schema) => …`?
- **Placement:** where does the wrapper live (inline, named helper, factory, library export, CLI recipe)?

## Metrics

| Metric            | Question                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------- |
| Honesty           | Do types match runtime? Does Zod show up if it never reaches the callback?                   |
| Tax fairness      | Does adding library A force assertions for library B?                                        |
| Simplicity        | Can a first Valibot `env.ts` be copied without a helper file or new export?                  |
| DRY / tuck-away   | Can the schema map stay a field map?                                                         |
| Composability     | Mixed maps, extra `arkenv` options, Vite/Bun `/standard`, a third off-value library later    |
| Vendor neutrality | No Valibot/Mini peers or subpaths on `@arkenv/standard`                                      |
| Footguns          | `typeMode: "ignore"`, `any` unsafety, silent skip vs throw                                   |
| Elegance          | Feels like the library, not a workaround the types failed to express                         |
| Teachability      | Docs can show it without a dissertation                                                      |
| Maintenance hell  | Does ArkEnv own a versioned runtime artifact that must track Valibot/Mini/host APIs forever? |

## Inventory

### A. How JSON Schema gets into coercion

| #  | Solution                                                 | Notes                                                                             |
| -- | -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| A1 | Per-key `toStandardJsonSchema(...)`                      | Original ugly path. Issue: not the happy path.                                    |
| A2 | Skip ArkEnv coercion, use pipes/transforms               | Pre-hatch workaround.                                                             |
| A3 | Bare `{ toJsonSchema }`                                  | Valibot default `typeMode: "ignore"` silently mis-coerces pipes. Locked rejected. |
| A4 | Optional-peer / `vendor === "valibot"` auto-detect       | Issue: out of scope. Magic; Mini also reports vendor `"zod"`.                     |
| A5 | `@arkenv/standard/valibot` or `@arkenv/valibot`          | Issue: out of scope. Splits the engine.                                           |
| A6 | Optional `toJsonSchema` callback (fallback after probes) | Shipped. Vendor-neutral. Hybrids work because Zod never calls it.                 |

A6 is the product. The rest of this note is how to type and place it.

### B. How the callback is typed

| #  | Solution                                              | Valibot-only                        | Zod + Valibot                     | Valibot + Mini                                          |
| -- | ----------------------------------------------------- | ----------------------------------- | --------------------------------- | ------------------------------------------------------- |
| B1 | `any`                                                 | No casts; pass `schema` to anything | Same                              | Same                                                    |
| B2 | `unknown`                                             | Need annotation or casts            | Same                              | Same                                                    |
| B3 | `StandardSchemaV1`                                    | Always `as GenericSchema`           | Same tax                          | Casts + vendor switch                                   |
| B4 | `T[keyof T]`                                          | No cast                             | **Cast appears when you add Zod** | Casts + vendor switch                                   |
| B5 | `ToJsonSchemaInput<T>` (exclude on-value JSON Schema) | No cast                             | **No cast**                       | Casts + vendor switch (honest: both reach the callback) |
| B6 | Always-`as` policy (B3 + teach casts as required)     | Always `as GenericSchema`           | Same cast (does not change)       | Casts + vendor switch (same as Valibot-only + Mini)     |

B5 was on the branch briefly. **B6 won** as the public story: docs and examples always assert at the host-converter call, even for Valibot-only / Mini-only. Not a new TypeScript kind — B3 chosen *on purpose*.

### C. Where the wrapper lives (tuck-away)

These assume A6 + either B5 or B6.

| #  | Solution                                                                                                            |
| -- | ------------------------------------------------------------------------------------------------------------------- |
| C1 | Inline wrapper at `arkenv(schema, { toJsonSchema })`                                                                |
| C2 | Named user-land function (`valibotJsonSchema` / mix fallback)                                                       |
| C3 | Generic `createEnv(schema, config?)` factory that bakes the converter in                                            |
| C4 | Export helpers from `@arkenv/standard` (`valibotJsonSchema()`, maybe Mini / mix)                                    |
| C5 | CLI recipe, same *intent* as hosting presets: emit source into the project, do not publish a runtime helper package |

## Hosting presets as the analogue (C5)

Host presets solved a similar “we could ship a package, and then we would have to version it forever” problem. t3-env-style **runtime validator objects** were rejected in [ADR 0018](./adr/0018-cli-hosting-preset-field-metadata.md): they would pull Zod/Valibot/ArkType into the CLI and require serializing schema ASTs back to source.

What shipped instead:

- Preset **semantics** live in the CLI as IR (`PRESETS` in `packages/arkenv/src/features/scaffold/presets.ts`): labels, key lists, `{ type: "string" } \| { type: "enum"; values }`.
- **Dialects** compile that IR to ArkType / Zod / Valibot source strings.
- `arkenv init --host-preset vercel` and `arkenv add host vercel` **merge keys into the user’s schema**. After that, the project owns the fields. ArkEnv does not publish `@arkenv/preset-vercel` for apps to depend on.
- `npx arkenv@latest add host …` is how templates move: the CLI package is versioned; the **copied schema is not**. Users are not pinned to a preset library that must track Vercel’s env vars on npm.

The command is `add host`, not `add preset`. The important property is **emit into user source**, not the verb.

A converter recipe would copy that property, not the IR. Host presets describe *fields*. `toJsonSchema` is *config wiring* plus a third-party function call (`typeMode` / `io` / `target`). Closer cousins already in the CLI:

- **Init dialects** could emit the Valibot wrapper when the chosen validator is Valibot (host-preset-during-init analogue).
- **`arkenv add …`** could splice a helper into an existing project (`add host` analogue).
- **`init --example with-valibot`** already copies a whole example that includes the wrapper. That is a full-project template, not a surgical add.

A plausible shape (not specified, not built):

```bash
npx arkenv@latest add to-json-schema valibot
# or: arkenv add converter valibot
```

Emits something like C2 (`to-json-schema.ts`, or an inline wrapper spliced into `arkenv()`), and may add `@valibot/to-json-schema` to the project. The user owns the file. Updating the recipe later is `npx arkenv@latest add …` again, same as host keys: latest CLI, no runtime preset package.

What does **not** carry over cleanly:

- Host `add` is **additive keys**. A helper file is **overwrite-or-merge of code**. Re-running `add host` skips existing keys; re-running a converter recipe can clobber user edits.
- Splicing `toJsonSchema:` into an existing `arkenv()` config is a new AST mutation. Key merge already exists; config-object merge does not.
- Valibot vs Mini vs mix are different snippets (and Mini’s options are `{ io, target }`, not `{ typeMode, target }`). Host IR has two field kinds; converter recipes are source text.
- Copied options can go stale relative to `@valibot/to-json-schema` until the user re-runs the CLI. That staleness is the *point* of not owning a runtime package; it is also the cost.

C5 does **not** replace A6 or the B-layer choice. Under B5, generated Valibot-only / Zod+Valibot snippets can stay assertion-free; under B6, generated snippets always include `as`. The mix snippet carries host-converter assertions either way.

## Evaluation

**A1 Per-key wrap** — DRY: F. Simplicity: F (N keys). Honesty: fine. Elegance: the thing we built the hatch to avoid.

**A2 Transforms instead of coercion** — Works, but splits “how numbers work” by validator. Not an ArkEnv feature; a surrender.

**A3 Bare reference** — Looks simplest, is the worst footgun. Fail.

**A4 Auto-detect** — High DRY, low honesty (Mini reports `"zod"`), optional peers, version lockstep. Looks elegant until it isn’t.

**A5 Vendor subpath** — Clean import graph, kills “one engine, any Standard Schema.” Heavy for a 6-line wrapper.

**A6 Callback** — Right product shape. Composable, vendor-neutral, fallback-only. Remaining pain is types + repetition of `{ typeMode, target }`.

**B1 `any`** — Maximum “simplicity,” zero honesty. Lets you pass `schema` to `fs.writeFile`.

**B2 `unknown`** — Honest at the ArkEnv boundary, noisy at every call site. Twoslash bait (`schema: unknown`).

**B3 `StandardSchemaV1`** — Honest *for ArkEnv*, mismatch *for the converter*. Forces `as GenericSchema` even when every field is Valibot. As a *fallback* if clever typing fails: B-tier. As an *intentional* public story: see B6.

**B4 `T[keyof T]`** — Almost. Valibot-only is nice. Adding Zod pollutes the callback with a type that never arrives. Tax unfairness is the bad feeling (“I asserted Valibot so I could use Zod”).

**B5 `ToJsonSchemaInput<T>`** — Best honesty/tax-fairness *when it works*. Types follow the probes. Zod + Valibot stays assertion-free. Cost: a second rule for Valibot + Mini (casts appear). Users can hit a “wait but…” when the map gains a second off-value library, or when reading why Zod+Valibot needs no `as` but Mini+Valibot does. Implementation cost: `HasOnValueJsonSchema`, generic `ParseStandardConfig<T>`, plugin `T` threading, `as unknown` at runtime boundaries.

**B6 Always-`as`** — Same types as B3; policy is “cast at every host-converter call.” One sentence of docs: *ArkEnv passes a Standard Schema; Valibot/Mini converters do not accept that type; assert at the call.* Metrics:

| Metric                    | Score vs B5                                                                                                                                                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Honesty                   | Equal at ArkEnv boundary (`StandardSchemaV1`). Cast is honest about the converter boundary. Does not pretend the callback param is already `GenericSchema`.                                                             |
| Tax fairness              | **Reframe, not a loss.** Tax is for *calling that converter*, not for sibling keys. Adding Zod does **not** change the Valibot wrapper (cast was already there). The old bad feeling was B4’s *delta*; B6 has no delta. |
| Simplicity / teachability | **Wins.** No branching: Valibot-only, Zod+Valibot, Mini-only all show `as`. Mix still needs a vendor switch, but that is “two converters,” not “ArkEnv typing phase of the moon.”                                       |
| Elegance                  | Feels like a downgrade next to B5’s no-cast Valibot-only. Gains elegance of *one model*.                                                                                                                                |
| Composability             | Equal for A6. Slightly less clever type plumbing to maintain.                                                                                                                                                           |
| Footguns                  | Same as B3: `as` can lie if you assert the wrong vendor. Mix still needs care. No `any`.                                                                                                                                |
| Maintenance hell          | **Better than B5.** Drop `ToJsonSchemaInput`, probe-mirroring types, and most plugin generic threading for the callback.                                                                                                |

The remaining “wait but…” under B6 is only Valibot+Mini (vendor switch + two casts). That case exists under B5 too. B6 does not invent it; B5’s special case for single-library maps invents the *other* branch.

**C1 Inline** — Best simplicity and teachability. With B5, Valibot-only and Zod+Valibot are assertion-free. Converter sits next to `arkenv()`, not in the field map. Not DRY across many files; most apps have one `env.ts`.

**C2 Named helper** — Best tuck-away without new API. Schema file is a map. Assertion (if any) lives once. Mix case: `GenericSchema | ZodMiniType` + vendor switch in that file. Slightly less “contextual” than inline, but assignable because the helper’s parameter is wider.

**C3 `createEnv` factory** — Maximum DRY and “schema-only” files. Costs a generic wrapper every consumer must understand. Overkill unless you already wrap `arkenv`. Easy to accidentally swallow `safe` / plugin configs if the helper is naive.

**C4 Library-exported `valibotJsonSchema()`** — Same DX as C2, blessed. The trap: `@arkenv/standard` cannot import Valibot without a peer or a subpath (both locked out). A dependency-free binder still needs the user to pass `toJsonSchema` in (`valibotJsonSchema(toJsonSchema)`): name clash, extra concept, Mini’s option shape differs, mix helper becomes a mini plugin system. High elegance *if* you accept vendor packages; it fights this package’s reason to exist. **This is the maintenance hell host presets refused.**

**C5 CLI recipe (host-preset analogue)** — Same DX as C2, distributed the way we already distribute host fields: copy into user source, evolve the template in the CLI, `npx arkenv@latest …` to pick up changes, no `@arkenv/valibot` to semver. Scores well on vendor neutrality and maintenance hell. Costs CLI surface, AST-splice complexity, and stale-copy semantics. Complements S; does not replace it. Init-time emission when the validator is Valibot is the cheap end of this spectrum; `add` for existing projects is the expensive end.

## Always-`as` usage (B6)

Public callback type: `(schema: StandardSchemaV1) => object | undefined`. Docs always assert at the converter.

**Valibot only / Zod + Valibot** (same wrapper either way):

```ts
toJsonSchema: (schema) =>
  toJsonSchema(schema as v.GenericSchema, {
    typeMode: "input",
    target: "draft-07",
  }),
```

**Zod Mini only:**

```ts
toJsonSchema: (schema) =>
  z.toJSONSchema(schema as z.ZodMiniType, {
    io: "input",
    target: "draft-07",
  }),
```

**Valibot + Zod Mini:** same vendor switch as today; both branches keep `as`. No special “only when mixing” rule — mixing is just two of the always-`as` calls behind a switch.

C2 under B6 can still tuck the cast into a named helper typed as `GenericSchema` / `ZodMiniType` (wider param than `StandardSchemaV1` is assignable). The cast (or the wide param) lives once; `env.ts` stays a field map.

## S and A usage by use case (B5 branch)

**S** below is C1 on **B5** (what the branch teaches today). **A** is the same typing tucked away: C2 / C3 / C5. If B6 wins, swap the S snippets for the Always-`as` section above; A-tier placement (C2–C5) still applies.

Classic Zod never needs a callback. Off-value maps do. Under B5, Zod + Valibot reuses the Valibot helper with no `as`.

### 1. Classic Zod only

No `toJsonSchema`. S and A are the same file.

```ts
import arkenv from "@arkenv/standard";
import { z } from "zod";

export const env = arkenv({
  PORT: z.number(),
  DEBUG: z.boolean(),
});
```

C2 / C3 / C5: do not add a converter. A Valibot `createEnv` that always passes `toJsonSchema` is still safe here (the callback is never invoked).

### 2. Valibot only

**S — inline**

```ts
import arkenv from "@arkenv/standard";
import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";

export const env = arkenv(
  { PORT: v.number(), DEBUG: v.boolean() },
  {
    toJsonSchema: (schema) =>
      toJsonSchema(schema, {
        typeMode: "input",
        target: "draft-07",
      }),
  },
);
```

**A — C2 named helper**

```ts
// to-json-schema.ts
import { toJsonSchema } from "@valibot/to-json-schema";
import type * as v from "valibot";

export const valibotJsonSchema = (schema: v.GenericSchema) =>
  toJsonSchema(schema, { typeMode: "input", target: "draft-07" });
```

```ts
// env.ts
import arkenv from "@arkenv/standard";
import * as v from "valibot";
import { valibotJsonSchema } from "./to-json-schema";

export const env = arkenv(
  { PORT: v.number(), DEBUG: v.boolean() },
  { toJsonSchema: valibotJsonSchema },
);
```

**A — C3 factory**

```ts
// create-env.ts
import arkenv from "@arkenv/standard";
import type { StandardEnvConfig } from "@arkenv/standard";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { toJsonSchema } from "@valibot/to-json-schema";

export function createEnv<const T extends Record<string, StandardSchemaV1>>(
  schema: T,
  config?: Omit<StandardEnvConfig<T>, "toJsonSchema">,
) {
  return arkenv(schema, {
    ...config,
    toJsonSchema: (schema) =>
      toJsonSchema(schema, {
        typeMode: "input",
        target: "draft-07",
      }),
  });
}
```

```ts
// env.ts
import * as v from "valibot";
import { createEnv } from "./create-env";

export const env = createEnv({
  PORT: v.number(),
  DEBUG: v.boolean(),
});
```

**A — C5 CLI** (hypothetical)

```bash
npx arkenv@latest add to-json-schema valibot
```

Writes the C2 helper (and wires `{ toJsonSchema: valibotJsonSchema }`, or inlines S during `init` when the validator is Valibot).

### 3. Zod Mini only

**S — inline**

```ts
import arkenv from "@arkenv/standard";
import * as z from "zod/mini";

export const env = arkenv(
  { PORT: z.number(), DEBUG: z.boolean() },
  {
    toJsonSchema: (schema) =>
      z.toJSONSchema(schema, {
        io: "input",
        target: "draft-07",
      }),
  },
);
```

**A — C2 named helper**

```ts
// to-json-schema.ts
import * as z from "zod/mini";

export const miniJsonSchema = (schema: z.ZodMiniType) =>
  z.toJSONSchema(schema, { io: "input", target: "draft-07" });
```

```ts
// env.ts
import arkenv from "@arkenv/standard";
import * as z from "zod/mini";
import { miniJsonSchema } from "./to-json-schema";

export const env = arkenv(
  { PORT: z.number(), DEBUG: z.boolean() },
  { toJsonSchema: miniJsonSchema },
);
```

**A — C3 factory**

```ts
toJsonSchema: (schema) =>
  z.toJSONSchema(schema, { io: "input", target: "draft-07" }),
```

inside the same `createEnv` pattern as Valibot. `env.ts` is schema-only.

**A — C5 CLI**

```bash
npx arkenv@latest add to-json-schema zod-mini
```

Emits the C2 Mini helper.

### 4. Classic Zod + Valibot

Same Valibot wrapper as use case 2. Zod never reaches the callback; no `as v.GenericSchema`.

**S — inline**

```ts
import arkenv from "@arkenv/standard";
import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";
import { z } from "zod";

export const env = arkenv(
  { PORT: z.number(), DEBUG: v.boolean() },
  {
    toJsonSchema: (schema) =>
      toJsonSchema(schema, {
        typeMode: "input",
        target: "draft-07",
      }),
  },
);
```

**A — C2** — reuse `valibotJsonSchema` from use case 2:

```ts
export const env = arkenv(
  { PORT: z.number(), DEBUG: v.boolean() },
  { toJsonSchema: valibotJsonSchema },
);
```

**A — C3** — reuse the Valibot `createEnv`:

```ts
export const env = createEnv({
  PORT: z.number(),
  DEBUG: v.boolean(),
});
```

**A — C5** — same command as Valibot-only (`add to-json-schema valibot`). Adding Zod later does not require a new recipe.

### 5. Valibot + Zod Mini

Both miss JSON Schema on the value. `vendor` does not narrow. Assertions live in the tucked helper, not next to the field map.

**S — inline**

```ts
import arkenv from "@arkenv/standard";
import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";
import * as z from "zod/mini";

export const env = arkenv(
  { PORT: v.number(), DEBUG: z.boolean() },
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

**A — C2 named helper**

```ts
// to-json-schema.ts
import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";
import * as z from "zod/mini";

export const toJsonSchemaFallback = (
  schema: v.GenericSchema | z.ZodMiniType,
) => {
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
};
```

```ts
// env.ts
import arkenv from "@arkenv/standard";
import * as v from "valibot";
import * as z from "zod/mini";
import { toJsonSchemaFallback } from "./to-json-schema";

export const env = arkenv(
  { PORT: v.number(), DEBUG: z.boolean() },
  { toJsonSchema: toJsonSchemaFallback },
);
```

**A — C3 factory** — bake that switch into `createEnv`; `env.ts` stays the field map.

**A — C5 CLI**

```bash
npx arkenv@latest add to-json-schema valibot,zod-mini
```

Emits the C2 mix helper. This is the only recipe that still contains `as` casts.

## Tier list

Solutions ranked as **answers to the whole problem** (coercion + types + call-site + who owns the snippet). Some are complete; some are pieces.

**S (chosen)**

- **A6 + B6 + C1** — Always-`as`. One rule. Cast is the converter boundary, not a map-shape tax. Shipped / shipping on `#1570`.

**A**

- **A6 + B5 + C1** — Off-value-only typing. Best tax fairness and no-cast Valibot-only. Declined: map-dependent “when do I need `as`?” branch.
- **C2 on top of S** — Named helper. Helper’s wide param (`GenericSchema`) absorbs the cast once.
- **C5 on top of S** — CLI emits C2. Not required to close `#1564`.
- **C3** — `createEnv` factory. Placement only.

**B**

- **C4 library helpers** — Correct instinct, wrong package.
- **B3 without B6 framing** — Same types as B6, but taught as “unfortunate cast” rather than “the rule.”

**C**

- **B4 (`T[keyof T]`)** — The almost-right type that makes adding Zod feel broken.
- **B2 (`unknown`)** — Safe and ugly.
- **A1 per-key wrap** — Works, scales linearly with pain.

**D**

- **B1 (`any`)** — Opposite of always-`as`: removes casts by lying.
- **A3 bare `{ toJsonSchema }`**
- **A4 auto-detect**
- **A2 transforms as the documented path**

**E**

- **A5 vendor subpath as the *only* way to coerce Valibot** — Solves wiring by fragmenting the engine.

## Current lean

**B6 shipped as the public story.** Placement lean unchanged: C1 default, C2 optional tuck-away, C5 later without C4, do not block `#1564` on C5/C4.

## Changelog of this note

- 2026-08-14: First write-up (layers A/B/C, metrics, tier list). Added C5 (CLI recipes / host-preset analogue).
- 2026-08-14: S and A usage examples across Zod, Valibot, Mini, Zod+Valibot, Valibot+Mini.
- 2026-08-14: Added B6 (always-`as`); re-ranked S-tier as B5 vs B6 contenders.
- 2026-08-14: **Decision: B6.** Reverted `ToJsonSchemaInput`; public callback is `StandardSchemaV1` with documented `as` at converter calls.
