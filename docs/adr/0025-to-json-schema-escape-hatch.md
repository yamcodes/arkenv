# ADR 0025: Optional `toJsonSchema` escape hatch (always-`as`)

## Status

Accepted

## Context

ADR 0002 pre-coerces env strings by introspecting **JSON Schema on the value**. Classic Zod puts that metadata on the schema. Valibot, Zod Mini, and Zod v3 keep conversion in a **standalone function** (`@valibot/to-json-schema`, `z.toJSONSchema`, `zod-to-json-schema`).

Users still need `v.number()` / Mini `z.boolean()` to coerce like Zod, without wrapping every key, giving up ArkEnv coercion, taking a Valibot/Mini peer on `@arkenv/standard` (ADR 0007), or lying in the types.

The awkward bit is a **type boundary**: ArkEnv hands a Standard Schema; host converters do not accept that type; `vendor` does not narrow Mini vs Valibot; Valibot’s bare function uses `typeMode: "ignore"` and silently mis-coerces pipes.

Three layers compose (hat loop for [#1564](https://github.com/yamcodes/arkenv/issues/1564) / [#1570](https://github.com/yamcodes/arkenv/pull/1570)):

1. **How JSON Schema gets into coercion** (product shape)
2. **How the callback is typed**
3. **Where the wrapper lives** (inline vs helper vs library export vs CLI recipe)

## Decision

Ship **A6 + B6 + C1**:

1. **Optional `toJsonSchema` callback** on `@arkenv/standard` config. Fallback after on-value probes. Not called when omitted, when `coerce` is `false`, or when JSON Schema was already read from the value. Return a plain object, `undefined` to skip that key, or throw / return a non-object to fail with `INVALID_SCHEMA`.
2. **Public type is `(schema: StandardSchemaV1) => object | undefined`.** Docs and examples **always assert** at the host-converter call (`as v.GenericSchema`, `as z.ZodMiniType`, `as z.ZodTypeAny`), including Valibot-only maps. The cast is the converter boundary, not a tax for sibling keys. Adding classic Zod does not change the Valibot wrapper (Zod never reaches the callback).
3. **Inline the wrapper** next to `arkenv()`. A named user-land helper is optional tuck-away. Do **not** export Valibot/Mini helpers from `@arkenv/standard`. Do **not** add `@arkenv/standard/valibot` (or similar) as the way to coerce Valibot.

```ts
toJsonSchema: (schema) =>
  toJsonSchema(schema as v.GenericSchema, {
    typeMode: "input",
    target: "draft-07",
  }),
```

## Rejected alternatives

**Product**

- Per-key `toStandardJsonSchema(...)` — scales linearly with pain; the hatch exists to avoid this.
- Bare `{ toJsonSchema }` — Valibot default `typeMode: "ignore"` silently mis-coerces pipes.
- Auto-detect by `vendor` / optional peer — Mini also reports `"zod"`; version lockstep; magic.
- Vendor subpath as the *only* coerce path — fragments the engine (ADR 0007).

**Typing**

- `any` / `unknown` — dishonest or noisy.
- `T[keyof T]` — Valibot-only is clean; **adding Zod pollutes the callback with a type that never arrives** (“I asserted Valibot so I could use Zod”).
- `ToJsonSchemaInput<T>` (exclude on-value JSON Schema) — best tax fairness when it works; declined because “when do I need `as`?” depends on the map. Probe-mirroring types and plugin generic threading were not worth the teachability cost.

**Placement**

- Library-exported `valibotJsonSchema()` — same DX as a user helper, but `@arkenv/standard` cannot import Valibot without a peer or subpath. A dependency-free binder still needs the user to pass the converter in. This is the maintenance hell hosting presets refused (ADR 0018).
- CLI `add to-json-schema` recipe — plausible later (emit into user source, no runtime package). Not required to close the hatch. Do not block on it.

## Consequences

- `@arkenv/standard` stays vendor-neutral: no Valibot/Mini peers, no converter options stuffed into the schema map.
- Docs teach one sentence: ArkEnv passes a Standard Schema; host converters do not accept that type; assert at the call. Mix maps (Valibot + Mini) still need a vendor switch; that is “two converters,” not a typing phase of the moon.
- Future architecture reviews should not re-suggest smart callback narrowing, auto-detect, or `@arkenv/valibot` helpers unless the teachability / packaging constraints change.
- A CLI converter recipe remains open; it would copy ADR 0018’s “emit into user source” property, not ship a runtime helper package.
