# CLI hosting preset field metadata (codegen IR)

To decide how the `arkenv` init flow describes hosting-provider preset fields (Vercel, Netlify, etc.) when generating validator-specific `env.ts` boilerplate, without pulling validator runtimes into the CLI or inventing an open-ended schema language.

## Context & problem

Phase 1 hosting presets ([#610](https://github.com/yamcodes/arkenv/issues/610), [#1288](https://github.com/yamcodes/arkenv/pull/1288), [#1322](https://github.com/yamcodes/arkenv/issues/1322)) need to emit typed schema lines for keys such as `VERCEL_ENV` across ArkType, Zod, and Valibot. Three approaches were considered on `dev`:

1. **Runtime validator objects (rejected).** Store presets as live Zod/Valibot/ArkType schema instances, similar to [t3-env presets](https://github.com/t3-oss/t3-env/blob/main/packages/core/src/presets-zod.ts). This would add validator dependencies to the CLI and require serializing schema ASTs back into source text for `env.ts` codegen.
2. **Standard Schema (rejected for this use case).** [Standard Schema](https://standard-schema.dev) is a runtime interop protocol (`~standard.validate`), not a declarative field-description format. It still implies holding validator instances, not describing fields for static emission.
3. **Metadata descriptors.** A closed, typed intermediate representation (IR) on each preset field:

   ```ts
   { type: "string" }
   | { type: "enum"; values: readonly string[] }
   ```

On `dev` (#1288), `getFieldDefinition` compiled these descriptors via validator string switches. On `v1`, escape hatch **(b)** from that decision is the chosen path: dialects own rendering.

## Decision

We adopt **metadata descriptors** as the Phase 1 codegen IR for hosting preset fields on `v1`, with dialect-owned compilation:

1. **`PRESETS` owns host semantics only.** Labels, server/client key lists, and per-key field metadata live in `packages/arkenv/src/features/scaffold/presets.ts`.
2. **Two field kinds only.** `string` and `enum` (with required `values`) via a discriminated `PresetField` union. No open-ended field vocabulary in Phase 1.
3. **Dialects compile IR to source strings.** `formatOptionalString` / `formatOptionalEnum` on each validator dialect render fields; there is no `getFieldDefinition` validator switch in the presets module.
4. **Client prefixes come from framework strategies.** Prefixed client keys use `FrameworkStrategy.clientPrefix` / `FRAMEWORK_CLIENT_PREFIXES`, not a local framework switch.
5. **Growth constraint.** Do **not** grow `PresetField` into an ad-hoc schema language without an explicit follow-up decision (JSON Schema subset remains the preferred escape hatch if richer kinds are needed).

## Consequences

- **Lean CLI.** No Zod/Valibot/ArkType runtime deps for preset codegen.
- **Aligned with scaffold seams.** Presets plug into dialects (#1311 / #1316) and universal `clientPrefix` (#1320 / #1321).
- **Watch the IR boundary.** A third field kind is a design review trigger, not an incremental `PresetField` extension.
- **Maintenance tripwire.** A `@remarks` note on `PresetField` references this ADR.
