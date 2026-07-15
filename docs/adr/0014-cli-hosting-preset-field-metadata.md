# CLI hosting preset field metadata (codegen IR)

To decide how the `@arkenv/cli` init flow describes hosting-provider preset fields (Vercel, Netlify, etc.) when generating validator-specific `env.ts` boilerplate, without pulling validator runtimes into the CLI or inventing an open-ended schema language.

## Context & problem

Phase 1 hosting presets ([#610](https://github.com/yamcodes/arkenv/issues/610), [#1288](https://github.com/yamcodes/arkenv/pull/1288)) need to emit typed schema lines for keys such as `VERCEL_ENV` across ArkType, Zod, and Valibot. Three approaches were considered:

1. **Runtime validator objects (rejected).** Store presets as live Zod/Valibot/ArkType schema instances, similar to [t3-env presets](https://github.com/t3-oss/t3-env/blob/main/packages/core/src/presets-zod.ts). This would add validator dependencies to the CLI and require serializing schema ASTs back into source text for `env.ts` codegen.
2. **Standard Schema (rejected for this use case).** [Standard Schema](https://standard-schema.dev) is a runtime interop protocol (`~standard.validate`), not a declarative field-description format. It still implies holding validator instances, not describing fields for static emission.
3. **Metadata descriptors (chosen for `dev`).** A closed, typed intermediate representation (IR) on each preset field:

   ```ts
   { type: "string" }
   | { type: "enum"; values: readonly string[] }
   ```

   `getFieldDefinition` compiles these descriptors into validator-specific schema strings at codegen time.

The metadata approach accomplishes Phase 1 goals with minimal CLI bloat. It also **rhymes with a JSON Schema subset** (`type: "string"`, `enum: [...]`) but uses a bespoke shape (`values` instead of `enum`) and only two kinds today.

## Decision

We adopt **metadata descriptors** as the Phase 1 codegen IR for hosting preset fields on `dev`.

1. **`PRESETS` owns host semantics.** Labels, server/client key lists, and per-key field metadata live in one declarative config (`packages/cli/src/features/scaffold/templates/presets.ts`).
2. **Two field kinds only.** `string` and `enum` (with required `values`) via a discriminated `PresetField` union. No open-ended field vocabulary in Phase 1.
3. **Codegen compiles IR to source strings.** Validator-specific output is produced by `getFieldDefinition` switches, not by runtime schemas.
4. **Growth constraint.** Do **not** grow `PresetField` into an ad-hoc schema language (url, number, default, nested objects, etc.) without an explicit follow-up decision.
5. **Future escape hatches** if presets need richer typing:
   - **(a)** Commit to a real **JSON Schema subset** as the IR (leveraging an existing declarative vocabulary instead of a third bespoke one), or
   - **(b)** On **`v1` forward-port**, keep `PRESETS` as host semantics only and move field rendering into **validator dialects** (`validators/dialects/`), aligned with the scaffold strategy refactor ([#1289](https://github.com/yamcodes/arkenv/issues/1289), [#1311](https://github.com/yamcodes/arkenv/pull/1311), [#1316](https://github.com/yamcodes/arkenv/pull/1316)).

## Consequences

- **Lean CLI.** No Zod/Valibot/ArkType runtime deps for preset codegen; no schema-to-source serialization pipeline.
- **Clear Phase 1 scope.** Two field kinds are sufficient for Vercel/Netlify keys today and are easier to review than full JSON Schema for this narrow use case.
- **Watch the IR boundary.** If a third field kind is requested, treat it as a design review trigger — not an incremental `PresetField` extension — per escape hatches (a) or (b) above.
- **`v1` alignment.** Forward-porting presets should plug into dialect + framework strategy seams rather than copying `getFieldDefinition` switches verbatim; framework `clientPrefix` should become first-class for all frameworks (including Vite/Bun), not only Next/Nuxt codegen config.
- **Maintenance tripwire.** A `@remarks` note on `PresetField` / `getFieldDefinition` references this ADR so contributors do not add field kinds or adopt runtime schemas without revisiting the decision.
