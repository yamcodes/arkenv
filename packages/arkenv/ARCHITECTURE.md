# ArkEnv Architecture

## Three-Tier Export Surface

ArkEnv ships three public entry points from a single npm package:

| Entry | Import | ArkType required? | Purpose |
|-------|--------|-------------------|---------|
| Main | `import { createEnv } from "arkenv"` | Yes (static) | ArkType-first `createEnv` + `type` helper |
| Standard | `import { createEnv } from "arkenv/standard"` | No | ArkType-free `createEnv` for Standard Schema users |
| Core | `import { ArkEnvError } from "arkenv/core"` | No | Mode-agnostic primitives (errors, types) |

The main entry re-exports `type` from `src/arktype/index.ts`, which statically imports ArkType. This is intentional: the main entry is the ArkType-first surface and its dependency on ArkType is explicit. Users who need an ArkType-free import use `arkenv/standard` or `arkenv/core`.

## Ownership Rules

- **Mode-specific exports** belong in the mode's entry (`src/index.ts` for ArkType, `src/standard.ts` for Standard Schema).
- **Mode-agnostic exports** (e.g. `ArkEnvError`) belong in `arkenv/core` (`src/core.ts`).
- **Internal modules** (`src/guards.ts`, `src/parse-standard.ts`, `src/arktype/`) are not public entries.

## Single-Implementation Invariant

The ArkType entry's `createEnv` MUST NOT contain ArkType-specific validation logic. Its only ArkType-specific step is calling `$.type.raw()` on the user's definition to produce a compiled schema. All subsequent validation — `onUndeclaredKey`, coercion, error collection — is handled by `parse` in `src/arktype/index.ts`.

Similarly, the standard entry delegates to `parseStandard` in `src/parse-standard.ts`. There is exactly one validation implementation per mode, and neither lives in an entry-point file itself.

If ArkType-specific behavior is needed, it belongs in `src/arktype/index.ts#parse`, not in `create-env.ts` or `src/index.ts`.

## Why One Package, Not Two

Splitting `arkenv/standard` into a separate npm package (`arkenv-standard`) would:
- Require separate versioning and release coordination
- Duplicate shared code (`ArkEnvError`, `parseStandard`, `guards.ts`)
- Fragment the documentation surface

The sub-path export approach (`arkenv/standard`) provides the same module isolation guarantee (disjoint module graph) at the bundler level, without the operational overhead of a separate package. Tree-shaking is NOT relied upon — the isolation is structural: `src/standard.ts` has no imports of `src/create-env.ts` or any ArkType module.
