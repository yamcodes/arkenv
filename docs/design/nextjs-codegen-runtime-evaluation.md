# Next.js Codegen vs. Runtime Architecture Evaluation

Living design evaluation using [the-hat](../../.agents/skills/the-hat/SKILL.md) loop. Update this note as options enter or leave the hat. Promoted decisions belong in `docs/adr/`.

**Status:** Working design note for [#1598](https://github.com/yamcodes/arkenv/issues/1598), [#1599](https://github.com/yamcodes/arkenv/issues/1599), [#1402](https://github.com/yamcodes/arkenv/issues/1402), and [#1403](https://github.com/yamcodes/arkenv/issues/1403).  
**Chosen public story (S-tier stack):** Next 15/16+ baseline (zero `jiti`) + Virtual `.arkenv/` aliasing + Framework package entry (`@arkenv/nextjs`) + Canonical `env` object with conditional exports + Typed `isEnabled` literal DCE helper + Structured Agent Envelopes.

---

## 1. Industry Context: The Prisma 8 Case Study

The evolution of TypeScript tooling across the ecosystem reflects a continuous battle with **monolithic code generation, bundler isolation, and repository clutter**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PRISMA 1–5: The Binary & Node_Modules Era                                              │
│ • Heavy Rust Query Engine binary running as a child process or N-API Node addon.       │
│ • Generated 30k–100k lines of client code inside `node_modules/.prisma/client`.        │
│ • 💥 Severe DX friction: broke Docker layers, monorepo pnpm/yarn PnP symlinks, CI      │
│   caching, and serverless/edge runtimes (Vercel Edge, Cloudflare Workers).             │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ PRISMA 6–7: Custom Paths & Driver Adapters                                             │
│ • Driver adapters allowed using `@neondatabase/serverless` / `pg` instead of Rust.     │
│ • Custom `output = "../src/generated/client"` with `tsconfig.json` path mappings.     │
│ • ⚠️ Still monolithic codegen: slow `prisma generate` step required before `tsc`.      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ PRISMA 8 ("Prisma Next"): Pure TypeScript Contract + Parameterized Runtime             │
│ • Zero Rust binary. 100% TypeScript runtime engine (`@prisma/orm-postgres/runtime`).   │
│ • No monolithic client codegen: generates only `contract.json` + `contract.d.ts`.      │
│ • Parameterized generic client: `postgres<Contract>({ contractJson })`.                │
│ • Drizzle-style composable SQL builder (`db.sql.selectFrom(...)`) + Model Collections. │
│ • AI Agent First: Structured CLI JSON envelopes + automatic skill syncing.             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Takeaways for ArkEnv

1. **The Death of `node_modules` Mutation:** Mutating `node_modules` (Prisma 1–5) is an anti-pattern that destroys caching, symlinks, and container builds. Virtualizing out-of-tree artifacts in `.arkenv/` avoids this entirely.
2. **Metadata Contract vs. Virtual Factory:** Prisma 8 emits a `contract.json` AST because it maps across languages (TypeScript to SQL) on the server. ArkEnv deals exclusively with JavaScript/TypeScript runtimes where native TypeScript inference suffices.
3. **Compiler Inlining Constraints:** While Prisma runs purely on the server, ArkEnv must satisfy the Next.js compiler (SWC/Turbopack) on the client, which demands literal `process.env.NEXT_PUBLIC_*` AST identifiers for dead-code elimination.
4. **Agent-Centric Tooling:** Modern developer tools must output machine-readable JSON envelopes with structured `nextActions` for AI coding agents.

---

## 2. Problem Statement

ArkEnv's mission is to provide typesafe environment variable validation with honest runtime coercion, fail-fast boot guarantees, and zero boilerplate across all JavaScript hosts.

On hosts with full bundler transform control (Vite and Bun), ArkEnv transforms the client graph at build time without generating disk artifacts ([ADR 0021](../adr/0021-env-object-canonical-surface.md)). On Next.js, however, lack of bundler transform ownership forced historical workarounds (`generated/env.gen.ts`, `jiti` config evaluation, manual/destructured `runtimeEnv`, and runtime `Proxy` guards).

Five specific tensions require a fundamental re-evaluation of `@arkenv/nextjs`:

1. **Dead-Code Elimination (DCE) of Feature Flags ([#1599](https://github.com/yamcodes/arkenv/issues/1599)):** Next.js compilers (SWC/Turbopack) constant-fold static identifiers (`process.env.NEXT_PUBLIC_FLAG === "true"`), allowing minifiers to strip unused client code. Imported object property access (`env.NEXT_PUBLIC_FLAG`) cannot be proven immutable cross-module, preventing dead-code elimination.
2. **Client Secret Sanitization & Schema Leaks ([#1598](https://github.com/yamcodes/arkenv/issues/1598)):** Next.js natively rewrites `process.env.SECRET` to `undefined` in Client Components. ArkEnv's flat layout blocks secret *values* via a runtime `Proxy` error, but secret *names and types* remain in the client graph. Compile-time isolation requires splitting files into strict layout.
3. **Codegen Disk Artifacts & Clutter ([#1402](https://github.com/yamcodes/arkenv/issues/1402)):** Next.js requires static `runtimeEnv` destructuring in `env.gen.ts` to trigger Next's AST replacement. Generating files inside `src/` creates disk noise, git clutter, and requires background watchers (`chokidar`) and `"postinstall": "arkenv generate"` hooks.
4. **Build-Time Transpilation Burden ([ADR 0014](../adr/0014-nextjs-jiti-build-time-validation.md)):** Supporting legacy Next.js (13/14) forced bundling `jiti` to parse TypeScript `env.ts` during `next.config.js` evaluation, introducing monorepo ESM/CJS dual-package hazards and `_jitiAliases` workarounds.
5. **Strict Layout Auto-Extend Friction ([#1403](https://github.com/yamcodes/arkenv/issues/1403)):** Server schemas in strict layout historically required manual `extends: [clientEnv]` composition or a generated server factory ([#1304](https://github.com/yamcodes/arkenv/issues/1304)).

---

## 3. Layer Map (Orthogonal Dimensions)

These dimensions compose into a complete architecture:

- **Layer A (Pipeline & Config Execution):** How environment schemas are loaded and validated during Next.js boot.
- **Layer B (Factory & Codegen Placement):** Where machine-generated accessor code lives.
- **Layer C (Client/Server Boundary Enforcement):** How secret values and types are isolated from client bundles.
- **Layer D (Feature Flags & DCE):** How conditional client code is stripped by minifiers.
- **Layer E (Version Support Baseline):** The minimum supported Next.js version matrix and legacy isolation.
- **Layer F (Schema Artifact Shape & Contract Boundaries):** The format and boundary of emitted build artifacts.
- **Layer G (AI Agent Ergonomics & Tooling Diagnostics):** How diagnostics and repair hints are surfaced to automated agents.
- **Layer H (Schema Factory Entrypoint & Import Aesthetics):** How the schema authoring factory is imported in `env.ts`.

---

## 4. Evaluation Metrics

| Metric | Question |
| :--- | :--- |
| **DCE Honesty** | Can minifiers dead-code-eliminate unused client code branches when a flag is off? |
| **Coercion Honesty** | Are numbers, booleans, and objects delivered as real types, not raw strings? |
| **Zero-Artifact DX** | Is the developer source tree free from committed machine-generated files? |
| **Next.js Stability** | Is the integration immune to Next.js minor and canary internal refactors? |
| **Zero-Friction Install** | Can the package be installed without global `package.json` overrides? |
| **Zero-Dependency Core** | Does `@arkenv/nextjs` maintain a minimal runtime/build footprint? |
| **Single Mental Model** | Does `import { env } from "./env"` remain consistent across frameworks? |
| **Import Idiomaticity** | Does the `env.ts` import feel like standard npm package syntax without hacks? |
| **Agent Actionability** | Can AI coding agents parse errors and apply fixes without hallucinations? |

---

## 5. The Hat (Inventory of Options)

### Layer A: Pipeline & Config Execution

| # | Option | Description |
| :- | :--- | :--- |
| **A1** | **`@next/env` Hijack (Varlock-style)** | Replace internal `@next/env` via package manager `overrides`/`resolutions`. |
| **A2** | **Native `next.config.ts` Execution** | Rely on Next 15/16 native TS transpilation for schema validation during config boot (zero `jiti`). |
| **A3** | **Internal `jiti` Loader (Status Quo)** | Bundle `jiti` inside `withArkEnv` to dynamically transpile `env.ts` in Next 13-16. |
| **A4** | **Unwrapped Top-Level Import** | Instruct users to write `import "./src/env"` manually in `next.config.ts` without `withArkEnv`. |

### Layer B: Factory & Codegen Placement

| # | Option | Description |
| :- | :--- | :--- |
| **B1** | **In-Tree Disk Factory (Status Quo)** | Emit `generated/env.gen.ts` directly beside user schemas. |
| **B2** | **Root `.arkenv/` + `resolveAlias` ([#1402](https://github.com/yamcodes/arkenv/issues/1402))** | Emit to gitignored `.arkenv/`, mapped via Webpack and Turbopack aliases. |
| **B3** | **Next Build Cache (`.next/cache/arkenv`)** | Store factories in Next's internal cache folder (fragile across cache wipes). |
| **B4** | **Pure In-Memory Virtual Module** | Virtual Webpack/Turbopack module without physical backing files (fails external `tsc --noEmit`). |

### Layer C: Client/Server Boundary Enforcement

| # | Option | Description |
| :- | :--- | :--- |
| **C1** | **Conditional Package Exports + Proxy ([ADR 0015](../adr/0015-nextjs-conditional-exports-boundary.md))** | Next.js resolves `react-server` vs `default` builds; runtime Proxy guards client reads. |
| **C2** | **Split-File Strict Layout + Auto-Extend ([#1403](https://github.com/yamcodes/arkenv/issues/1403))** | Separate `client.ts` / `server.ts` modules with auto-merging via `#arkenv/client-env`. |
| **C3** | **AST Secret Stripping (Vite/Bun Transform)** | Strip non-public properties from client AST (impossible in Turbopack). |
| **C4** | **Varlock-style Decorator Sensitivity** | Use `.env.schema` decorators (`@sensitive`, `@public`, `@dynamic`) with build injection. |

### Layer D: Feature Flags & Dead-Code Elimination (DCE)

| # | Option | Description |
| :- | :--- | :--- |
| **D1** | **Object Only (Accept DCE Loss)** | Pure `if (env.FLAG)`; document that object property reads forfeit minifier DCE ([#1599](https://github.com/yamcodes/arkenv/issues/1599) Outcome B). |
| **D2** | **Official Typed Literal Escape Hatch** | Export `isEnabled<Env>("KEY", process.env.KEY)` combining static binary comparison (`=== "true"`) with schema validation. |
| **D3** | **Compiler Macro / SWC Transform** | Attempt AST call-site rewriting of `env.KEY` (rejected for Turbopack). |
| **D4** | **Raw `process.env` Fallback Pattern** | Recommend raw `process.env.NEXT_PUBLIC_FLAG === "true"` in docs for heavy client branches. |

### Layer E: Version Support Baseline

| # | Option | Description |
| :- | :--- | :--- |
| **E1** | **Universal Support (Next 13–16+)** | Maintain `jiti` and legacy mocks across all versions. |
| **E2** | **Next 15+ / 16+ Baseline on v1** | Drop Next 13/14 from v1; make `next.config.ts` and `turbopack.resolveAlias` first-class. |
| **E3** | **Subpath / Legacy Package Fork** | Maintain `@arkenv/nextjs` (modern Next 15+) and `@arkenv/nextjs/legacy` (Next 13/14). |

### Layer F: Schema Artifact Shape & Contract Boundaries

| # | Option | Description |
| :- | :--- | :--- |
| **F1** | **Monolithic Factory Codegen (Prisma 7 / ArkEnv v0)** | Emit a monolithic `.ts` file containing hardcoded `createEnv` wrapper with full static `runtimeEnv` block. |
| **F2** | **Metadata Contract + Generic Runtime (Prisma 8)** | Emit `contract.json` + `contract.d.ts` and pass to a generic runtime engine (`arkenv<Contract>({ json })`). Fails Next.js client DCE because dynamic keys prevent AST inlining. |
| **F3** | **Zero-Artifact Type Inference + Virtual Factory (ArkEnv S-Tier)** | Pure TypeScript schema in `env.ts` with a virtual `.arkenv/env.gen.ts` factory generated strictly for Next.js bundler identifier destructuring. |

### Layer G: AI Agent Ergonomics & Tooling Diagnostics

| # | Option | Description |
| :- | :--- | :--- |
| **G1** | **Unstructured Terminal Output (Status Quo)** | Standard ANSI console logging during build and CLI execution. |
| **G2** | **Structured Agent Envelopes with `nextActions` (Prisma 8 style)** | Add `--json` flag to `arkenv check` and `arkenv init` returning machine-readable diagnostics, error codes, and actionable repair commands for AI coding agents. |

### Layer H: Schema Factory Entrypoint & Import Aesthetics

| # | Option | Description |
| :- | :--- | :--- |
| **H1** | **Framework Package Entry (`@arkenv/nextjs`)** | `import arkenv from "@arkenv/nextjs"` in Next.js; `import arkenv from "@arkenv/nuxt"` in Nuxt; `import arkenv from "@arkenv/core"` in Node. Standard npm syntax with zero strange symbols. |
| **H2** | **Universal Core Package Entry (`@arkenv/core`)** | `import { arkenv } from "@arkenv/core"` across all frameworks; build plugins (Next `withArkEnv`, Nuxt module, Vite plugin) alias/transform the import at build time. |
| **H3** | **Framework Subpath Entry (`@arkenv/nextjs/env`)** | `import arkenv from "@arkenv/nextjs/env"`. Explicit subpath separating schema factory from runtime utilities (`isEnabled`). |
| **H4** | **Node Subpath Import (`#arkenv/env`)** | `import arkenv from "#arkenv/env"`. Uses `package.json` `"imports"` mapping. |
| **H5** | **Relative Virtual Artifact (`./.arkenv/env.gen`)** | `import arkenv from "./.arkenv/env.gen"`. Explicit relative path directly to the generated factory file. |

---

## 6. Detailed Evaluation against Metrics

| Stack Combination | DCE Honesty | Coercion Honesty | Zero-Artifact DX | Next.js Stability | Zero-Friction Install | Zero-Dependency Core | Single Mental Model | Import Idiomaticity | Agent Actionability |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **S-Tier (A2 + B2 + C1/C2 + D2 + E2 + F3 + G2 + H1/H3)** | 🟢 High (`isEnabled`) | 🟢 Full (Honest) | 🟢 Clean (`.arkenv/`) | 🟢 Native API | 🟢 Standard npm | 🟢 0 runtime deps | 🟢 Unified `env` | 🟢 Standard Package (`@arkenv/nextjs`) | 🟢 Structured JSON |
| **Universal Core (A2 + B2 + C1/C2 + D2 + E2 + F3 + G2 + H2)** | 🟢 High (`isEnabled`) | 🟢 Full (Honest) | 🟢 Clean (`.arkenv/`) | 🟢 Native API | 🟢 Standard npm | 🟢 0 runtime deps | 🟢 100% Cross-FW | 🟢 Standard Package (`@arkenv/core`) | 🟢 Structured JSON |
| **Subpath Node (A2 + B2 + C1/C2 + D2 + E2 + F3 + G2 + H4)** | 🟢 High (`isEnabled`) | 🟢 Full (Honest) | 🟢 Clean (`.arkenv/`) | 🟢 Native API | 🟢 Standard npm | 🟢 0 runtime deps | 🟢 Unified `env` | 🟡 `#` Subpath Syntax | 🟢 Structured JSON |
| **Prisma 8 Style (A2 + B2 + C1 + D1 + E2 + F2 + G2 + H1)** | 🔴 Broken on Client | 🟢 Full (Honest) | 🟢 Clean (`contract.json`) | 🟢 Native API | 🟢 Standard npm | 🟢 0 runtime deps | 🟢 Parameterized | 🟢 Standard Package | 🟢 Structured JSON |
| **Varlock Model (A1 + B2 + C4 + D1 + E1 + F1 + G1 + H5)** | 🔴 Lost on Object | 🔴 Strings Only | 🟡 Out-of-tree | 🔴 Fragile Overrides | 🔴 Needs Overrides | 🔴 Large Footprint | 🔴 Divergent `ENV` | 🔴 Relative Path | 🟡 Unstructured |
| **Status Quo v0 (A3 + B1 + C1 + D1 + E1 + F1 + G1 + H5)** | 🔴 Lost on Object | 🟢 Full (Honest) | 🔴 `src/generated` | 🟡 Jiti Workarounds | 🟢 Standard npm | 🔴 Bundles Jiti | 🟢 Unified `env` | 🔴 `./generated/env.gen` | 🟡 Unstructured |

---

## 7. Deep-Dive on Open Architectural Questions

### Q1: Instant TypeScript Types Without Prior Build Steps
**Question:** If `env.ts` imports from `@arkenv/nextjs` (or `@arkenv/nextjs/env`), how does TypeScript recognize the types on a fresh `git clone` before `next dev` runs?

**Answer:**
`@arkenv/nextjs` is a real, published npm package that ships static TypeScript typings. When you author `env.ts`:
```ts
import arkenv from "@arkenv/nextjs";
export const env = arkenv({ DATABASE_URL: "string", NEXT_PUBLIC_API: "string" });
```
TypeScript resolves the generic `arkenv(schema)` signature directly from `node_modules/@arkenv/nextjs`. The return type is inferred **instantaneously in the IDE on day 0**, with zero prior build steps or pre-existing `.arkenv/` folders required. The build-time factory in `.arkenv/env.gen.ts` only exists to satisfy the bundler's runtime AST destructuring.

---

### Q2: Monorepos & Shared Packages (e.g. `packages/db/env.ts`)
**Question:** In a monorepo, how do we support a shared `packages/db/env.ts` that is imported by both a Next.js app and a plain Node background worker?

**Answer:**
1. **Server-only shared packages use `@arkenv/core`:** A database package (`packages/db`) or queue worker (`packages/queue`) is inherently server-only and framework-agnostic. It imports `import { arkenv } from "@arkenv/core"` and validates against `process.env`.
2. **Framework packages (`@arkenv/nextjs`, `@arkenv/nuxt`) are application-level only:** Framework adapters are exclusively required in application roots (`apps/web`, `apps/dashboard`) where client-side bundle splitting (`NEXT_PUBLIC_*` / `NUXT_PUBLIC_*`) and minifier Dead-Code Elimination (DCE) must be satisfied.
3. **Seamless Interop:** Next.js Server Components and Route Handlers can import `packages/db` without any special Next.js wrapping because server-side Node execution reads `process.env` transparently.

---

## 8. The Tier List

### S-Tier (The Converged Architecture)

$$\mathbf{\text{S-Tier Stack (v1)}} = \mathbf{A2} + \mathbf{B2} + \mathbf{C1/C2} + \mathbf{D2} + \mathbf{E2} + \mathbf{F3} + \mathbf{G2} + \mathbf{H1/H3}$$

* **A2 (Native `next.config.ts` Execution):** Leverages Next 15+ native TypeScript execution for zero-dependency build-time validation.
* **B2 (Virtual `.arkenv/` Placement):** Keeps user source trees 100% clean; mapped via Webpack and `turbopack.resolveAlias`.
* **C1/C2 (Conditional Exports + Strict Auto-Extend):** Canonical `import { env } from "./env"` on flat layouts; `#arkenv/client-env` auto-extend on strict layouts.
* **D2 (Official `isEnabled` Literal Helper):** Enables minifiers (Terser/SWC/ESBuild) to constant-fold client feature flags while preserving full TypeScript schema safety.
* **E2 (Next 15+ Baseline):** Purges `jiti`, `mock-server-only`, and `chokidar` from the core `@arkenv/nextjs` distribution.
* **F3 (Virtual Factory):** Emits only the minimal factory needed for Next.js AST identifier replacement without in-tree pollution.
* **G2 (Structured Agent Envelopes):** Equips the ArkEnv CLI with structured machine diagnostics and `nextActions` for AI agents.
* **H1 / H3 (Framework Package / Subpath Entry):** `import arkenv from "@arkenv/nextjs"` (or `@arkenv/nextjs/env`). Clean, idiomatic npm imports with zero `#` syntax.

---

### A-Tier (Viable Alternatives)

* **H2 (Universal `@arkenv/core` Entry):** Superb cross-framework universality where `env.ts` is 100% identical in Next.js, Nuxt, Vite, and Node, relying on bundler aliases.
* **B1 (Status Quo In-Tree Codegen):** Functional and reliable, but leaves `generated/env.gen.ts` littering user source folders.
* **D1 (Object only with accepted DCE loss):** Acceptable for small apps, but frustrates teams with large client feature flags.

---

### C-Tier (High Overhead / Friction)

* **H4 (Subpath `#arkenv/env`):** Fully standard in Node.js, but unfamiliar `#` symbol causes hesitation among frontend developers.
* **F2 (Metadata Contract without AST replacement):** Works well for server-only ORMs (Prisma 8), but breaks Next.js client-side variable inlining.
* **A3 (Universal `jiti` transpilation across Next 13–16):** Carries permanent build complexity and monorepo ESM hazards.

---

### D-Tier (Fragile or Broken)

* **H5 (Relative `./.arkenv/env.gen`):** Ugly relative path requiring dot-folder traversal.
* **A1 (Varlock-style `@next/env` package manager override):** Fragile across minor Next.js releases; causes lockfile/symlink installation issues and monorepo friction.
* **B3 (`.next/cache/arkenv`):** Cache wipes break standalone builds and IDE typechecking.
* **B4 (In-memory virtual module without disk backing):** Breaks standalone `tsc --noEmit` and IDE navigation.

---

### F-Tier (Architecturally Impossible)

* **C3 (Custom SWC AST Transform under Turbopack):** Turbopack does not support custom JS/TS SWC transform plugins.

---

## 9. Concrete Usage Examples for S-Tier

### 1. `next.config.ts` (Next 15+ / 16+)

```ts title="./next.config.ts"
import type { NextConfig } from "next";
import { withArkEnv } from "@arkenv/nextjs/config";

const nextConfig: NextConfig = {};

// Automatically configures Turbopack resolveAlias and Webpack aliases
export default withArkEnv(nextConfig);
```

### 2. Schema Declaration (Flat Layout)

```ts title="./env.ts"
import arkenv from "@arkenv/nextjs"; // Standard, clean package import!

export const env = arkenv({
  DATABASE_URL: "string",
  NEXT_PUBLIC_API_URL: "string",
  NEXT_PUBLIC_ADMIN_DASHBOARD: "boolean = false",
});

export type Env = typeof env;
```

### 3. Application Consumption (Anywhere in App)

```ts title="./app/api/route.ts"
import { env } from "@/env"; // Standard application alias

console.log(env.DATABASE_URL);
```

### 4. Strict Layout with Auto-Extend ([#1403](https://github.com/yamcodes/arkenv/issues/1403))

```ts title="./env/server.ts"
import arkenv from "@arkenv/nextjs/server";

// Auto-extends ./client.ts via #arkenv/client-env without manual extends array
export const env = arkenv({
  DATABASE_URL: "string",
});
```

### 5. Dead-Code Elimination (DCE) for Client Feature Flags

```tsx title="./components/admin-preview.tsx"
"use client";

import { isEnabled } from "@arkenv/nextjs";
import type { Env } from "@/env";

export function Header() {
  // Next compiler inlines process.env -> "false" === "true" -> minifier strips heavy chunk
  if (
    isEnabled<Env>(
      "NEXT_PUBLIC_ADMIN_DASHBOARD",
      process.env.NEXT_PUBLIC_ADMIN_DASHBOARD,
    )
  ) {
    return <HeavyAdminModule />;
  }

  return <StandardHeader />;
}
```

---

## 10. Current Lean & Implementation Plan

1. **Target Next 15+ as v1 baseline:** Deprecate Next 13/14 in `@arkenv/nextjs` root entry; remove `jiti`, `mock-server-only`, and `chokidar`.
2. **Implement Virtual `.arkenv/` ([#1402](https://github.com/yamcodes/arkenv/issues/1402)):** Default `outputPath` to `.arkenv/env.gen.ts`; alias `@arkenv/nextjs` to `.arkenv/env.gen.ts`.
3. **Ship Strict Auto-Extend ([#1403](https://github.com/yamcodes/arkenv/issues/1403)):** Wire `#arkenv/client-env` alias resolution in `withArkEnv`.
4. **Ship `isEnabled` DCE Helper:** Export `isEnabled` from `@arkenv/nextjs` and document feature flag optimization patterns.
5. **Add Structured Agent Envelopes (`--json`):** Implement machine-readable diagnostics in `arkenv check --json` for agent repair loops.
6. **Close [#1598](https://github.com/yamcodes/arkenv/issues/1598) and [#1599](https://github.com/yamcodes/arkenv/issues/1599)** referencing this evaluation note.

---

## 11. Changelog of this Note

- **2026-08-25:** Added Section 7 addressing TypeScript day-0 typings without prior builds, monorepo shared package interop (`@arkenv/core` in `packages/db`), and Option A/B namespace hygiene.
- **2026-08-25:** Added Layer H (Schema Factory Entrypoint & Import Aesthetics); evaluated H1 (`@arkenv/nextjs`), H2 (`@arkenv/core`), H3 (`@arkenv/nextjs/env`), H4 (`#arkenv/env`), and H5 (`./.arkenv/env.gen`).
- **2026-08-25:** Added Prisma 8 Case Study; introduced Layer F (Artifact Shape) and Layer G (Agent Ergonomics); finalized upgraded S-Tier stack with `--json` agent envelopes.
- **2026-08-24:** Initial write-up using `/the-hat` methodology; integrated deep audit of Varlock Next.js integration and Next 15/16 baseline simplifications.
