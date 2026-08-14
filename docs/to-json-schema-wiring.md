# Wiring off-value JSON Schema converters

Living evaluation, not an ADR. Update this file as options enter or leave the hat. Promoted decisions belong in `docs/adr/` (related: [0002](./adr/0002-coercion-schema-transformer.md), [0007](./adr/0007-standard-mode-packaging-strategy.md), [0018](./adr/0018-cli-hosting-preset-field-metadata.md)).

**Status:** working note for `#1564` / PR `#1570`. Default public story on the branch is **S** below (`ToJsonSchemaInput<T>` + inline wrapper). Everything else is still in the hat.

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

| Metric | Question |
| --- | --- |
| Honesty | Do types match runtime? Does Zod show up if it never reaches the callback? |
| Tax fairness | Does adding library A force assertions for library B? |
| Simplicity | Can a first Valibot `env.ts` be copied without a helper file or new export? |
| DRY / tuck-away | Can the schema map stay a field map? |
| Composability | Mixed maps, extra `arkenv` options, Vite/Bun `/standard`, a third off-value library later |
| Vendor neutrality | No Valibot/Mini peers or subpaths on `@arkenv/standard` |
| Footguns | `typeMode: "ignore"`, `any` unsafety, silent skip vs throw |
| Elegance | Feels like the library, not a workaround the types failed to express |
| Teachability | Docs can show it without a dissertation |
| Maintenance hell | Does ArkEnv own a versioned runtime artifact that must track Valibot/Mini/host APIs forever? |

## Inventory

### A. How JSON Schema gets into coercion

| # | Solution | Notes |
| --- | --- | --- |
| A1 | Per-key `toStandardJsonSchema(...)` | Original ugly path. Issue: not the happy path. |
| A2 | Skip ArkEnv coercion, use pipes/transforms | Pre-hatch workaround. |
| A3 | Bare `{ toJsonSchema }` | Valibot default `typeMode: "ignore"` silently mis-coerces pipes. Locked rejected. |
| A4 | Optional-peer / `vendor === "valibot"` auto-detect | Issue: out of scope. Magic; Mini also reports vendor `"zod"`. |
| A5 | `@arkenv/standard/valibot` or `@arkenv/valibot` | Issue: out of scope. Splits the engine. |
| A6 | Optional `toJsonSchema` callback (fallback after probes) | Shipped. Vendor-neutral. Hybrids work because Zod never calls it. |

A6 is the product. The rest of this note is how to type and place it.

### B. How the callback is typed

| # | Solution | Valibot-only | Zod + Valibot | Valibot + Mini |
| --- | --- | --- | --- | --- |
| B1 | `any` | No casts; pass `schema` to anything | Same | Same |
| B2 | `unknown` | Need annotation or casts | Same | Same |
| B3 | `StandardSchemaV1` | Always `as GenericSchema` | Same tax | Casts + vendor switch |
| B4 | `T[keyof T]` | No cast | **Cast appears when you add Zod** | Casts + vendor switch |
| B5 | `ToJsonSchemaInput<T>` (exclude on-value JSON Schema) | No cast | **No cast** | Casts + vendor switch (honest: both reach the callback) |

B5 is what is on the branch now.

### C. Where the wrapper lives (tuck-away)

These assume A6 + a decent B (ideally B5).

| # | Solution |
| --- | --- |
| C1 | Inline wrapper at `arkenv(schema, { toJsonSchema })` |
| C2 | Named user-land function (`valibotJsonSchema` / mix fallback) |
| C3 | Generic `createEnv(schema, config?)` factory that bakes the converter in |
| C4 | Export helpers from `@arkenv/standard` (`valibotJsonSchema()`, maybe Mini / mix) |
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

C5 does **not** replace B5. Generated Valibot-only / Zod+Valibot snippets can stay assertion-free because of B5. The mix snippet still carries host-converter assertions, tucked in the generated file.

## Evaluation

**A1 Per-key wrap** — DRY: F. Simplicity: F (N keys). Honesty: fine. Elegance: the thing we built the hatch to avoid.

**A2 Transforms instead of coercion** — Works, but splits “how numbers work” by validator. Not an ArkEnv feature; a surrender.

**A3 Bare reference** — Looks simplest, is the worst footgun. Fail.

**A4 Auto-detect** — High DRY, low honesty (Mini reports `"zod"`), optional peers, version lockstep. Looks elegant until it isn’t.

**A5 Vendor subpath** — Clean import graph, kills “one engine, any Standard Schema.” Heavy for a 6-line wrapper.

**A6 Callback** — Right product shape. Composable, vendor-neutral, fallback-only. Remaining pain is types + repetition of `{ typeMode, target }`.

**B1 `any`** — Maximum “simplicity,” zero honesty. Lets you pass `schema` to `fs.writeFile`.

**B2 `unknown`** — Honest at the ArkEnv boundary, noisy at every call site. Twoslash bait (`schema: unknown`).

**B3 `StandardSchemaV1`** — Honest *for ArkEnv*, dishonest *for the converter*. Forces `as GenericSchema` even when every field is Valibot.

**B4 `T[keyof T]`** — Almost. Valibot-only is nice. Adding Zod pollutes the callback with a type that never arrives. Tax unfairness is the bad feeling.

**B5 `ToJsonSchemaInput<T>`** — Best honesty/tax-fairness. Types follow the probes. Mix of two off-value libs still needs casts; those casts are for a real union, not for Zod-that-isn’t-there.

**C1 Inline** — Best simplicity and teachability. With B5, Valibot-only and Zod+Valibot are assertion-free. Converter sits next to `arkenv()`, not in the field map. Not DRY across many files; most apps have one `env.ts`.

**C2 Named helper** — Best tuck-away without new API. Schema file is a map. Assertion (if any) lives once. Mix case: `GenericSchema | ZodMiniType` + vendor switch in that file. Slightly less “contextual” than inline, but assignable because the helper’s parameter is wider.

**C3 `createEnv` factory** — Maximum DRY and “schema-only” files. Costs a generic wrapper every consumer must understand. Overkill unless you already wrap `arkenv`. Easy to accidentally swallow `safe` / plugin configs if the helper is naive.

**C4 Library-exported `valibotJsonSchema()`** — Same DX as C2, blessed. The trap: `@arkenv/standard` cannot import Valibot without a peer or a subpath (both locked out). A dependency-free binder still needs the user to pass `toJsonSchema` in (`valibotJsonSchema(toJsonSchema)`): name clash, extra concept, Mini’s option shape differs, mix helper becomes a mini plugin system. High elegance *if* you accept vendor packages; it fights this package’s reason to exist. **This is the maintenance hell host presets refused.**

**C5 CLI recipe (host-preset analogue)** — Same DX as C2, distributed the way we already distribute host fields: copy into user source, evolve the template in the CLI, `npx arkenv@latest …` to pick up changes, no `@arkenv/valibot` to semver. Scores well on vendor neutrality and maintenance hell. Costs CLI surface, AST-splice complexity, and stale-copy semantics. Complements S; does not replace it. Init-time emission when the validator is Valibot is the cheap end of this spectrum; `add` for existing projects is the expensive end.

## Call-site shapes (for comparison)

Valibot-only / Zod + Valibot, inline (C1), no assertion:

```ts
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

Named helper (C2), including what a C5 emit would look like for Valibot + Mini:

```ts
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

export const env = arkenv(schema, { toJsonSchema: toJsonSchemaFallback });
```

## Tier list

Solutions ranked as **answers to the whole problem** (coercion + types + call-site + who owns the snippet). Some are complete; some are pieces.

**S**

- **A6 + B5 + C1** — Callback, typed as off-value schemas only, inline wrapper. Default story. One `env.ts`, no Valibot tax for Zod, no `any`, no new exports, no CLI.

**A**

- **C2 on top of S** — Named helper when you want the schema map alone. User-land. Mix assertions stay in the helper.
- **C5 on top of S** — How we would *ship* C2 without C4’s package. Same maintenance story as host presets. Worth it if init/add already need a Valibot dialect path; not required to close `#1564`.
- **C3** — Same idea as C2 if you already own a `createEnv`. Not worth teaching as the happy path.

**B**

- **C4 library helpers** — Correct instinct, wrong package. Revisit only with a vendor subpath or `@arkenv/valibot` — a different product decision, not a typing fix. Host presets exist specifically so we do not do this.
- **B3 (`StandardSchemaV1`)** — Honest ArkEnv boundary, bad converter boundary. Acceptable fallback if B5 ever proves too clever.

**C**

- **B4 (`T[keyof T]`)** — The almost-right type that makes adding Zod feel broken.
- **B2 (`unknown`)** — Safe and ugly.
- **A1 per-key wrap** — Works, scales linearly with pain.

**D**

- **B1 (`any`)**
- **A3 bare `{ toJsonSchema }`**
- **A4 auto-detect**
- **A2 transforms as the documented path**

**E**

- **A5 vendor subpath as the *only* way to coerce Valibot** — Solves wiring by fragmenting the engine.

## Current lean

Keep **S** as the public API and docs default. Mention **C2** as optional tuck-away. Treat **C5** as the way to bless C2 later without taking C4’s maintenance hell: emit source from the CLI (especially Valibot init), do not export `valibotJsonSchema` from `@arkenv/standard`. Do not block `#1564` on C5.

## Changelog of this note

- 2026-08-14: First write-up (layers A/B/C, metrics, tier list). Added C5 (CLI recipes / host-preset analogue).
