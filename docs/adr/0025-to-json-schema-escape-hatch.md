# ADR 0025: Optional `toJsonSchema` escape hatch (always-`as`) and subpath exports

## Status

Amended (2026-08-24 by [#1586](https://github.com/yamcodes/arkenv/issues/1586))

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
3. **Inline the wrapper** next to `arkenv()`. A named user-land helper is optional tuck-away.

```ts
toJsonSchema: (schema) =>
  toJsonSchema(schema as v.GenericSchema, {
    typeMode: "input",
    target: "draft-07",
  }),
```

---

## Amendment (2026-08-24): First-Class Subpaths & Modern Support Boundary

### Context for Amendment

Valibot is a first-class validator promoted across the homepage hero and marketing surfaces alongside ArkType and Zod with the claim "No boilerplate." Requiring an inline `toJsonSchema` configuration block in user-land `env.ts` contradicts that DX guarantee.

To restore DX symmetry across the Big Three validators while preserving engine purity, we amend the packaging decision to introduce first-class subpath exports on `@arkenv/standard`.

### Amended Decision

1. **First-Class Subpath Exports on `@arkenv/standard`:**
   - `import { arkenv } from "@arkenv/standard/valibot"`: Pre-configures coercion using `@valibot/to-json-schema` (`typeMode: "input"`, `target: "draft-07"`).
   - `import { arkenv } from "@arkenv/standard/zod-mini"`: Pre-configures coercion using `zod-to-json-schema`.
   - *Note on Zod*: Classic Zod already exposes JSON Schema on the value (ADR 0002), so root `import { arkenv } from "@arkenv/standard"` works zero-config out of the box. A redundant `@arkenv/standard/zod` alias is deferred to separate exploration.
2. **Optional Peer Dependency Architecture:**
   - `@valibot/to-json-schema` and `zod-to-json-schema` are declared under `peerDependencies` with `peerDependenciesMeta: { "...": { "optional": true } }`.
   - The root import `import { arkenv } from "@arkenv/standard"` remains pure with zero runtime dependencies.
3. **Hard Modern Support Boundary (No Root Shims):**
   - Subpaths are exposed strictly via the `package.json` `"exports"` field with `"files": ["dist"]`.
   - We reject legacy root proxy shims (`valibot.d.ts`, `valibot.js`, `zod-mini.d.ts`, etc.) to maintain structural consistency with our existing framework packages (`@arkenv/nextjs`, `@arkenv/nuxt`, `@arkenv/vite-plugin`), which already rely strictly on `package.json` exports.
   - Target consumers must use modern TypeScript module resolution (`moduleResolution: "bundler" | "node16" | "nodenext"`) and modern package managers (npm v7+, pnpm, yarn berry).
4. **Preserved Escape Hatch:**
   - The `toJsonSchema` callback remains fully supported on `@arkenv/standard` config as an escape hatch for custom schema transformers or long-tail validator libraries not covered by the subpaths.

## Consequences

- **Zero-Boilerplate Valibot DX:** Valibot users get identical one-liner DX (`import { arkenv } from "@arkenv/standard/valibot"`) without boilerplate in `env.ts`.
- **Zero Runtime Bloat:** Root `@arkenv/standard` remains 100% dependency-free.
- **Pristine Package Footprint:** No legacy shim files in package roots; build outputs remain contained within `dist/`.
- **Docs & CLI Alignment:** `arkenv init` scaffolds `@arkenv/standard/valibot` for Valibot and `@arkenv/standard` for Zod directly.
