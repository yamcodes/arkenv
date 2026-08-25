# Next.js Codegen vs. Runtime Architecture Evaluation

Living design evaluation using [the-hat](../../.agents/skills/the-hat/SKILL.md) loop. Update this note as options enter or leave the hat. Promoted decisions belong in `docs/adr/`.

**Status:** Working design note for [#1598](https://github.com/yamcodes/arkenv/issues/1598), [#1599](https://github.com/yamcodes/arkenv/issues/1599), [#1402](https://github.com/yamcodes/arkenv/issues/1402), and [#1403](https://github.com/yamcodes/arkenv/issues/1403).\
**Chosen public story (S-tier stack):** Next 15/16+ baseline (zero `jiti`) + Virtual `.arkenv/` aliasing + Canonical `env` object with conditional exports + Typed `isEnabled` literal DCE helper.

---

## 1. Problem Statement

ArkEnv's mission is to provide typesafe environment variable validation with honest runtime coercion, fail-fast boot guarantees, and zero boilerplate across all JavaScript hosts.

On hosts with full bundler transform control (Vite and Bun), ArkEnv transforms the client graph at build time without generating disk artifacts ([ADR 0021](../adr/0021-env-object-canonical-surface.md)). On Next.js, however, lack of bundler transform ownership forced historical workarounds (`generated/env.gen.ts`, `jiti` config evaluation, manual/destructured `runtimeEnv`, and runtime `Proxy` guards).

Five specific tensions require a fundamental re-evaluation of `@arkenv/nextjs`:

1. **Dead-Code Elimination (DCE) of Feature Flags ([#1599](https://github.com/yamcodes/arkenv/issues/1599)):** Next.js compilers (SWC/Turbopack) constant-fold static identifiers (`process.env.NEXT_PUBLIC_FLAG === "true"`), allowing minifiers to strip unused client code. Imported object property access (`env.NEXT_PUBLIC_FLAG`) cannot be proven immutable cross-module, preventing dead-code elimination.
2. **Client Secret Sanitization & Schema Leaks ([#1598](https://github.com/yamcodes/arkenv/issues/1598)):** Next.js natively rewrites `process.env.SECRET` to `undefined` in Client Components. ArkEnv's flat layout blocks secret *values* via a runtime `Proxy` error, but secret *names and types* remain in the client graph. Compile-time isolation requires splitting files into strict layout.
3. **Codegen Disk Artifacts & Clutter ([#1402](https://github.com/yamcodes/arkenv/issues/1402)):** Next.js requires static `runtimeEnv` destructuring in `env.gen.ts` to trigger Next's AST replacement. Generating files inside `src/` creates disk noise, git clutter, and requires background watchers (`chokidar`) and `"postinstall": "arkenv generate"` hooks.
4. **Build-Time Transpilation Burden ([ADR 0014](../adr/0014-nextjs-jiti-build-time-validation.md)):** Supporting legacy Next.js (13/14) forced bundling `jiti` to parse TypeScript `env.ts` during `next.config.js` evaluation, introducing monorepo ESM/CJS dual-package hazards and `_jitiAliases` workarounds.
5. **Strict Layout Auto-Extend Friction ([#1403](https://github.com/yamcodes/arkenv/issues/1403)):** Server schemas in strict layout historically required manual `extends: [clientEnv]` composition or a generated server factory ([#1304](https://github.com/yamcodes/arkenv/issues/1304)).

---

## 2. Layer Map (Orthogonal Dimensions)

These dimensions compose into a complete architecture:

- **Layer A (Pipeline & Config Execution):** How environment schemas are loaded and validated during Next.js boot.
- **Layer B (Factory & Codegen Placement):** Where machine-generated accessor code lives.
- **Layer C (Client/Server Boundary Enforcement):** How secret values and types are isolated from client bundles.
- **Layer D (Feature Flags & DCE):** How conditional client code is stripped by minifiers.
- **Layer E (Version Support Baseline):** The minimum supported Next.js version matrix and legacy isolation.

---

## 3. Evaluation Metrics

| Metric                    | Question                                                                          |
| :------------------------ | :-------------------------------------------------------------------------------- |
| **DCE Honesty**           | Can minifiers dead-code-eliminate unused client code branches when a flag is off? |
| **Coercion Honesty**      | Are numbers, booleans, and objects delivered as real types, not raw strings?      |
| **Zero-Artifact DX**      | Is the developer source tree free from committed machine-generated files?         |
| **Next.js Stability**     | Is the integration immune to Next.js minor and canary internal refactors?         |
| **Zero-Friction Install** | Can the package be installed without global `package.json` overrides?             |
| **Zero-Dependency Core**  | Does `@arkenv/nextjs` maintain a minimal runtime/build footprint?                 |
| **Single Mental Model**   | Does `import { env } from "./env"` remain consistent across frameworks?           |

---

## 4. The Hat (Inventory of Options)

### Layer A: Pipeline & Config Execution

| #      | Option                                  | Description                                                                                        |
| :----- | :-------------------------------------- | :------------------------------------------------------------------------------------------------- |
| **A1** | **`@next/env` Hijack (Varlock-style)**  | Replace internal `@next/env` via package manager `overrides`/`resolutions`.                        |
| **A2** | **Native `next.config.ts` Execution**   | Rely on Next 15/16 native TS transpilation for schema validation during config boot (zero `jiti`). |
| **A3** | **Internal `jiti` Loader (Status Quo)** | Bundle `jiti` inside `withArkEnv` to dynamically transpile `env.ts` in Next 13-16.                 |
| **A4** | **Unwrapped Top-Level Import**          | Instruct users to write `import "./src/env"` manually in `next.config.ts` without `withArkEnv`.    |

### Layer B: Factory & Codegen Placement

| #      | Option                                                                                         | Description                                                                                      |
| :----- | :--------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| **B1** | **In-Tree Disk Factory (Status Quo)**                                                          | Emit `generated/env.gen.ts` directly beside user schemas.                                        |
| **B2** | **Root `.arkenv/` + `resolveAlias` ([#1402](https://github.com/yamcodes/arkenv/issues/1402))** | Emit to gitignored `.arkenv/`, mapped via Webpack and Turbopack aliases.                         |
| **B3** | **Next Build Cache (`.next/cache/arkenv`)**                                                    | Store factories in Next's internal cache folder (fragile across cache wipes).                    |
| **B4** | **Pure In-Memory Virtual Module**                                                              | Virtual Webpack/Turbopack module without physical backing files (fails external `tsc --noEmit`). |

### Layer C: Client/Server Boundary Enforcement

| #      | Option                                                                                                   | Description                                                                              |
| :----- | :------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| **C1** | **Conditional Package Exports + Proxy ([ADR 0015](../adr/0015-nextjs-conditional-exports-boundary.md))** | Next.js resolves `react-server` vs `default` builds; runtime Proxy guards client reads.  |
| **C2** | **Split-File Strict Layout + Auto-Extend ([#1403](https://github.com/yamcodes/arkenv/issues/1403))**     | Separate `client.ts` / `server.ts` modules with auto-merging via `#arkenv/client-env`.   |
| **C3** | **AST Secret Stripping (Vite/Bun Transform)**                                                            | Strip non-public properties from client AST (impossible in Turbopack).                   |
| **C4** | **Varlock-style Decorator Sensitivity**                                                                  | Use `.env.schema` decorators (`@sensitive`, `@public`, `@dynamic`) with build injection. |

### Layer D: Feature Flags & Dead-Code Elimination (DCE)

| #      | Option                                  | Description                                                                                                                                         |
| :----- | :-------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D1** | **Object Only (Accept DCE Loss)**       | Pure `if (env.FLAG)`; document that object property reads forfeit minifier DCE ([#1599](https://github.com/yamcodes/arkenv/issues/1599) Outcome B). |
| **D2** | **Official Typed Literal Escape Hatch** | Export `isEnabled<Env>("KEY", process.env.KEY)` combining static binary comparison (`=== "true"`) with schema validation.                           |
| **D3** | **Compiler Macro / SWC Transform**      | Attempt AST call-site rewriting of `env.KEY` (rejected for Turbopack).                                                                              |
| **D4** | **Raw `process.env` Fallback Pattern**  | Recommend raw `process.env.NEXT_PUBLIC_FLAG === "true"` in docs for heavy client branches.                                                          |

### Layer E: Version Support Baseline

| #      | Option                              | Description                                                                              |
| :----- | :---------------------------------- | :--------------------------------------------------------------------------------------- |
| **E1** | **Universal Support (Next 13–16+)** | Maintain `jiti` and legacy mocks across all versions.                                    |
| **E2** | **Next 15+ / 16+ Baseline on v1**   | Drop Next 13/14 from v1; make `next.config.ts` and `turbopack.resolveAlias` first-class. |
| **E3** | **Subpath / Legacy Package Fork**   | Maintain `@arkenv/nextjs` (modern Next 15+) and `@arkenv/nextjs/legacy` (Next 13/14).    |

---

## 5. Detailed Evaluation against Metrics

### Deep Dive: Varlock Next.js Integration (A1 + C4)

Varlock ([varlock.dev/integrations/nextjs](https://varlock.dev/integrations/nextjs/)) introduces notable ideas alongside severe operational trade-offs:

- **The Mechanism:** Varlock replaces `@next/env` by requiring package-manager level `overrides` (npm/pnpm/bun) or `resolutions` (yarn). In `next.config.ts`, `varlockNextConfigPlugin()` provides an imported `ENV` object (`import { ENV } from 'varlock/env'`), inlines non-sensitive variables at build time, and marks SSR routes dynamic when sensitive/dynamic values are read.
- **The Strengths:**
  1. Integrates with Next's native environment pipeline so `process.env.KEY` and `ENV.KEY` both work.
  2. Granular sensitivity control via schema decorators (`@defaultSensitive`, `@sensitive=false`, `@dynamic`).
  3. Seamless log redaction and sourcemap scrubbing.
- **The Operational Pitfalls:**
  1. **Lockfile & Symlink Hazards:** Overriding internal scoped packages (`@next/env`) frequently causes dangling symlinks in npm/pnpm. Varlock's own documentation highlights common `Cannot find module '@next/env'` and `process.env.__VARLOCK_ENV is not set` errors, requiring full `rm -rf node_modules package-lock.json` resets.
  2. **Turbopack JS Loader Edge Incompatibilities:** Varlock hit Next 15.0–15.4 Turbopack loader crashes (`lint TP1006`) when `middleware.ts` existed, forcing version-specific loader scoping workarounds.
  3. **Standalone Deployment Friction:** Next.js `output: standalone` builds do not bundle external CLI tools or `.env` files. Varlock requires adding `cp .env.* .next/standalone` to build scripts and booting via `varlock run -- node .next/standalone/server.js`.
  4. **Monorepo Pollution:** Package manager overrides are workspace-global, forcing all apps in a monorepo to adopt the override simultaneously.
  5. **String-Only Process Boundary:** Because `process.env` in Node only holds strings, full coercion (numbers, objects, custom schemas) must still flow through their separate `ENV` accessor rather than native `process.env`.

**Verdict on A1:** While Varlock's feature set is impressive, relying on `@next/env` package manager overrides introduces unacceptable fragility for ArkEnv. ArkEnv is a TypeScript validation engine, not an ambient CLI secret-runner.

---

### Deep Dive: Next 15+ / 16+ Modern Baseline (A2 + E2)

Setting the minimum Next.js version to **Next 15.0+ (and Next 16+)** on the `v1` branch dramatically simplifies the architecture:

- **Elimination of `jiti` ([ADR 0014](../adr/0014-nextjs-jiti-build-time-validation.md) Revoked):** Next.js 15+ natively transpiles `next.config.ts` using its internal SWC engine. When `withArkEnv` runs inside `next.config.ts`, importing `env.ts` evaluates TypeScript natively. `jiti`, `_jitiAliases`, and `mock-server-only.ts` are completely deleted.
- **First-Class Turbopack Configuration:** Next.js 16 promotes Turbopack configuration to top-level `turbopack.resolveAlias` (stabilizing `experimental.turbo.resolveAlias`). Webpack and Turbopack can be configured symmetrically in fewer than 20 lines of code.
- **Result:** `@arkenv/nextjs` becomes a **zero-dependency** adapter package.

---

### Deep Dive: Dead-Code Elimination (DCE) & Feature Flag Mechanics (Layer D)

Minifiers (Terser, SWC, ESBuild) only eliminate dead code branches when expressions evaluate to literal boolean values at compile-time (`"false" === "true"` $\rightarrow$ `false` $\rightarrow$ dead branch stripped).

1. **Why `if (env.NEXT_PUBLIC_FLAG)` fails DCE (D1):** `env` is an exported object reference. Cross-module property reads are opaque to minifiers.
2. **Why `Boolean(process.env.NEXT_PUBLIC_FLAG)` fails:** In JavaScript, `Boolean("false") === true`. Inlining `"false"` leads to active feature flags.
3. **The `isEnabled` Solution (D2):**
   ArkEnv can provide a dedicated helper:
   ```ts
   export function isEnabled<TEnv>(
     _key: keyof TEnv,
     value: string | undefined
   ): boolean {
     return value === "true" || value === "1";
   }
   ```
   - At compile time: Next.js inlines `process.env.NEXT_PUBLIC_FEATURE` as `"false"`.
   - With standard minifier inlining or macro expansion: `isEnabled("NEXT_PUBLIC_FEATURE", "false")` evaluates to `"false" === "true"` $\rightarrow$ `false` $\rightarrow$ dead branch completely removed.
   - At typecheck time: TypeScript verifies that the first argument is a valid boolean/flag key in the schema.

---

## 6. Tier List

Ranked as **complete architectural stacks**:

### S-Tier (Chosen Default Story for v1)

**Stack: A2 (Native `next.config.ts`) + B2 (Virtual `.arkenv/`) + C1/C2 (Conditional Exports + Auto-Extend Strict) + D2 (`isEnabled` Helper) + E2 (Next 15+ Baseline)**

- **Why it wins:**
  1. **Zero dependencies:** Dropping Next 13/14 deletes `jiti`, `chokidar`, and all mock files.
  2. **Clean source tree:** Generated factories live in root `.arkenv/` (gitignored), resolved via official Webpack + Turbopack aliases.
  3. **Full Turbopack compatibility:** Uses official `turbopack.resolveAlias`.
  4. **Complete DCE story:** `isEnabled` provides typed compile-time dead-code elimination without violating object coercion honesty.
  5. **Unified mental model:** `import { env } from "./env"` works identically across Next, Nuxt, Vite, and Bun.

---

### A-Tier (Complementary Affordances & Documentation)

- **D4 (Documented raw identifier pattern):** Complement `isEnabled` with explicit documentation on how minifiers treat `process.env.NEXT_PUBLIC_*`.
- **E3 (Legacy Subpath / Package):** If enterprise demand for Next 13/14 remains significant, isolate `jiti` into `@arkenv/nextjs/legacy` so the primary package stays clean.

---

### B-Tier (Viable but Suboptimal)

- **B1 (Status Quo In-Tree Codegen):** Functional and reliable, but leaves `generated/env.gen.ts` littering user source folders.
- **D1 (Object only with accepted DCE loss):** Acceptable for small apps, but frustrates teams with large client feature flags.

---

### C-Tier (High Overhead / Friction)

- **A3 (Universal `jiti` transpilation across Next 13–16):** Carries permanent build complexity and monorepo ESM hazards.
- **C2 without Auto-Extend:** Forcing manual `extends: [clientEnv]` in strict mode imposes unnecessary boilerplate.

---

### D-Tier (Fragile or Broken)

- **A1 (Varlock-style `@next/env` package manager override):** Fragile across minor Next.js releases; causes lockfile/symlink installation issues and monorepo friction.
- **B3 (`.next/cache/arkenv`):** Cache wipes break standalone builds and IDE typechecking.
- **B4 (In-memory virtual module without disk backing):** Breaks standalone `tsc --noEmit` and IDE navigation.

---

### F-Tier (Architecturally Impossible)

- **C3 (Custom SWC AST Transform under Turbopack):** Turbopack does not support custom JS/TS SWC transform plugins.

---

## 7. Concrete Usage Examples for S-Tier

### 1. `next.config.ts` (Next 15+ / 16+)

```ts title="./next.config.ts"
import type { NextConfig } from "next";
import { withArkEnv } from "@arkenv/nextjs/config";

const nextConfig: NextConfig = {};

// Automatically injects Turbopack resolveAlias and Webpack aliases for .arkenv/
export default withArkEnv(nextConfig);
```

### 2. Schema Declaration (Flat Layout)

```ts title="./env.ts"
import arkenv from "@/env"; // Virtual alias mapped to .arkenv/env.gen.ts

export const env = arkenv({
  DATABASE_URL: "string",
  NEXT_PUBLIC_API_URL: "string",
  NEXT_PUBLIC_ADMIN_DASHBOARD: "boolean = false",
});

export type Env = typeof env;
```

### 3. Strict Layout with Auto-Extend ([#1403](https://github.com/yamcodes/arkenv/issues/1403))

```ts title="./env/server.ts"
import arkenv from "@arkenv/nextjs/server";

// Auto-extends ./client.ts via #arkenv/client-env without manual extends array
export const env = arkenv({
  DATABASE_URL: "string",
});
```

### 4. Dead-Code Elimination (DCE) for Client Feature Flags

```tsx title="./components/admin-preview.tsx"
"use client";

import { isEnabled } from "@arkenv/nextjs";
import type { Env } from "../env";

export function Header() {
  // SWC inlines process.env -> "false" === "true" -> minifier drops heavy chunk
  if (isEnabled<Env>("NEXT_PUBLIC_ADMIN_DASHBOARD", process.env.NEXT_PUBLIC_ADMIN_DASHBOARD)) {
    return <HeavyAdminModule />;
  }

  return <StandardHeader />;
}
```

---

## 8. Current Lean & Implementation Plan

1. **Target Next 15+ as v1 baseline:** Deprecate Next 13/14 in `@arkenv/nextjs` root entry; remove `jiti`, `mock-server-only`, and `chokidar`.
2. **Implement Virtual `.arkenv/` ([#1402](https://github.com/yamcodes/arkenv/issues/1402)):** Update `withArkEnv` to register `turbopack.resolveAlias` and Webpack `resolve.alias` pointing to `.arkenv/`.
3. **Ship Strict Auto-Extend ([#1403](https://github.com/yamcodes/arkenv/issues/1403)):** Wire `#arkenv/client-env` alias resolution in `withArkEnv`.
4. **Ship `isEnabled` DCE Helper:** Export `isEnabled` from `@arkenv/nextjs` and document feature flag optimization patterns.
5. **Close [#1598](https://github.com/yamcodes/arkenv/issues/1598) and [#1599](https://github.com/yamcodes/arkenv/issues/1599)** referencing this evaluation note.

---

## 9. Changelog of this Note

- **2026-08-24:** Initial write-up using `/the-hat` methodology; integrated deep audit of Varlock Next.js integration and Next 15/16 baseline simplifications.
