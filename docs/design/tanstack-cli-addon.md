# TanStack CLI Add-on for ArkEnv

Living evaluation, not an ADR. Update this file as options enter or leave the hat. Promoted decisions belong in `docs/adr/`.

**Status:** working note for TanStack CLI add-on integration. **Chosen public story:** Stack `A1 + B1 + C2 + D2 + E1` (undecided, proposed S).

---

## Problem

TanStack CLI (`tanstack create`, `tanstack add`, `@tanstack/cli`) allows developers to scaffold new TanStack Start and TanStack Router applications and layer in ecosystem capabilities (auth, databases, ORMs, monitoring, tooling) via modular **add-ons**. Currently, TanStack CLI includes `t3env` as a built-in tooling add-on for environment variable validation, but has no built-in or official add-on for **ArkEnv**.

When we are done:
1. Developers must be able to scaffold a fresh TanStack Start application with ArkEnv configured out of the box via `tanstack create <app> --add-ons <url>` (and eventually via short name in the built-in catalog).
2. The add-on must configure dependencies (`@arkenv/core` / `@arkenv/standard`, `@arkenv/vite-plugin`), wire `arkenv()` into `vite.config.ts`, generate a typesafe `src/env.ts` schema module, and provide an immediate demonstration of full-stack server-key protection and client inlining.
3. The add-on source, compile pipeline, tests, and distribution assets must live in this repository without drifting as ArkEnv moves through `alpha`, `rc`, and `1.0.0` GA.
4. The add-on design must provide a friction-free bridge to submit an upstream PR to `@tanstack/create` to become a first-class built-in catalog add-on.

---

## Layer map

- **Layer A (Monorepo Placement & Packaging):** where the authoring source, metadata, and compile target live in the `arkenv` repository. Items here are substitutes.
- **Layer B (Distribution & Hosting):** how developers and the `tanstack` CLI fetch and consume the add-on. Composes with Layer A.
- **Layer C (Validator Engine & Schema Options):** what schema engines the add-on supports (ArkType default vs. Standard Schema / Zod / Valibot options). Composes with A and B.
- **Layer D (Scaffolding Assets & Demo Scope):** what files, routes, and UI components are injected into the target project. Composes with A, B, and C.
- **Layer E (Version Pinning & Release Automation):** how package versions (`@arkenv/core`, `@arkenv/vite-plugin`) are managed across release channels (`alpha`, `rc`, GA). Composes with all above.

Items on different layers compose into a cohesive **stack**. Do not flatten them into a single false choice.

---

## Metrics

| Metric | Question |
| ------ | -------- |
| **Monorepo Coherence & Zero Drift** | Does the add-on participate in Turborepo CI (`check`, `typecheck`, `test`, `build`), ensuring core engine or plugin changes never silently break the add-on? |
| **TanStack CLI Spec Compliance** | Does the artifact strictly adhere to `@tanstack/create`'s add-on spec (`.add-on/info.json`, `add-on.json`, `assets/`, `integrations`, EJS variables)? |
| **Distribution Reliability** | Can developers run a simple, immutable, publicly accessible command/URL without local prerequisites or friction? |
| **"Show, Don't Tell" DX** | Does the generated app immediately demonstrate ArkEnv's unique runtime protection (server secret throw on client, public inlining) rather than leaving an inert config file? |
| **Upstream Catalog Bridge** | Does the structure make it trivial to copy or upstream into `@tanstack/create/src/frameworks/react/add-ons/arkenv`? |
| **Maintenance Tax** | How much developer overhead is required to maintain, test, version, and publish the add-on on new releases? |

---

## The hat

### Layer A — Monorepo Placement & Packaging

| # | Option | Notes |
| - | ------ | ----- |
| A1 | Workspace package `packages/tanstack-addon` | Managed with `pnpm`, builds `.add-on` and `add-on.json`, runs CI tests, can publish to npm. |
| A2 | Dedicated top-level directory `addons/tanstack` | Authoring directory outside `packages/`, standalone `package.json` and build scripts. |
| A3 | Authoring sandbox inside `apps/playgrounds/tanstack-start-addon` | Uses a real TanStack Start project that runs `tanstack add-on dev/compile`. |
| A4 | Static files directly in `apps/www/public/tanstack/` | No build step; raw `info.json` and asset templates manually authored in docs site public folder. |
| A5 | Separate external repository (`yamcodes/tanstack-addon-arkenv`) | Isolated repository solely for the add-on. (Include to score rejection). |

### Layer B — Distribution & Hosting

| # | Option | Notes |
| - | ------ | ----- |
| B1 | Hosted static URL on docs domain (`info.json`) | Hosted by Next.js in `apps/www`, updated on every docs deploy. |
| B1a | Reverse Proxy on `main` (`arkenv.js.org/tanstack/*` -> `arkenv-v1.vercel.app`) | Allows using `https://arkenv.js.org/tanstack/info.json` from Day 1 without waiting for v1 GA. |
| B1b | Direct v1 preview URL (`https://arkenv-v1.vercel.app/tanstack/info.json`) with GA redirect | Zero changes to `main` during alpha; redirects to `arkenv.js.org` at GA. |
| B1c | Direct static deploy to `main` via `sync-main` | Cherry-pick `apps/www/public/tanstack/` onto `main` so `arkenv.js.org` serves it natively. |
| B2 | Published npm package `@arkenv/tanstack-addon` | Distributed via npm registry; consumed via `npx` or npm package download. |
| B3 | GitHub raw content URL (`https://raw.githubusercontent.com/...`) | Fetched directly from GitHub git tree without hosting infrastructure. |
| B4 | Upstream built-in catalog PR to `@tanstack/create` | Native `tanstack create --add-ons arkenv` without specifying an external URL. |

### Layer C — Validator Engine & Schema Options

| # | Option | Notes |
| - | ------ | ----- |
| C1 | ArkType-only (`@arkenv/core` + `arktype`) | Opinionated ArkEnv default. Zero options to choose during scaffolding. |
| C2 | Configurable option via `info.json` (`validator: "arktype" | "zod" | "valibot"`) | Prompts developer during `tanstack create`, templates `env.ts.ejs` and `package.json.ejs` (`@arkenv/core` vs `@arkenv/standard`). |
| C3 | Standard Schema / Zod-only | Matches existing `t3env` TanStack add-on conventions, but ignores ArkType flagship syntax. |

### Layer D — Scaffolding Assets & Demo Scope

| # | Option | Notes |
| - | ------ | ----- |
| D1 | Minimal env setup only | Injects `src/env.ts`, `vite.config.ts` plugin, `.env.example`, and dependencies. No routes or components. |
| D2 | Minimal env setup + Demo Route (`/demo/arkenv`) | Injects `src/env.ts`, Vite plugin, plus a demo route showing server-side loader/action reading `DATABASE_URL` and client rendering `VITE_API_URL`. |
| D3 | Minimal env setup + Demo Route + Secret Leak Interactive Trigger | Includes the full demo route plus a `SecretLeakButton` component that demonstrates the client throw when attempting to access server keys. |

### Layer E — Version Pinning & Release Automation

| # | Option | Notes |
| - | ------ | ----- |
| E1 | Dynamic sync from `RELEASE_CONFIG` / build script | Injects active release channel (`alpha`, `rc`, GA) into `package.json.ejs` / `info.json` during compile. |
| E2 | Hardcoded pinned alpha versions | Hardcoded e.g. `^1.0.0-alpha.1` in the template files, manually updated. |
| E3 | Floating `latest` tag on npm | Relies on `latest` tag on npm (fails during pre-release alpha/rc phases where npm tag is `alpha`). |

---

## Evaluation

### Layer A — Monorepo Placement & Packaging

- **A1 `packages/tanstack-addon`**:
  - *Pros:* High monorepo coherence. Lives alongside `@arkenv/vite-plugin`, `@arkenv/core`, and `@arkenv/rsbuild-plugin`. Turborepo automatically typechecks, lints, and tests it. Can compile `.add-on/` and output `add-on.json` into both package `dist/` and `apps/www/public/tanstack/`.
  - *Cons:* Adds one package to the pnpm workspace; requires a `package.json` with build scripts.
  - *Score:* Excellent across all metrics. Zero drift guaranteed by workspace CI.

- **A2 `addons/tanstack`**:
  - *Pros:* Clean separation between published core libraries and community add-on templates.
  - *Cons:* Sits outside standard `packages/*` and `apps/*` pnpm workspace globs unless `pnpm-workspace.yaml` is updated. Can be neglected during monorepo refactors.
  - *Score:* Good, but creates a one-off directory category in the repo.

- **A3 `apps/playgrounds/tanstack-start-addon`**:
  - *Pros:* Ideal for running `tanstack add-on dev` because it's a full runnable TanStack Start app.
  - *Cons:* Blurs the line between playground consumption and publishable add-on artifact.
  - *Score:* Useful for interactive development or smoke testing, but inferior as the canonical artifact home.

- **A4 Static files directly in `apps/www/public/tanstack/`**:
  - *Pros:* No compilation step needed to serve over HTTP; simple static JSON and asset serving.
  - *Cons:* Extremely high maintenance tax and drift footgun. Template strings and file contents stored as raw strings inside `info.json` / `add-on.json` are not typechecked or linted by Biome/TypeScript.
  - *Score:* D-tier. High risk of shipping broken code in stringified JSON.

- **A5 Separate external repository**:
  - *Pros:* Decoupled release cycle from the core monorepo.
  - *Cons:* Instant git drift. When `@arkenv/vite-plugin` or `@arkenv/core` APIs change in v1, the external repo breaks unnoticed.
  - *Score:* E-tier (rejected). Breaks the monorepo source of truth.

---

### Layer B — Distribution & Hosting

- **B1 Hosted static URL on docs domain (`info.json`)**:
  - *Context:* During the `v1` alpha phase, `arkenv.js.org` serves `main` (v0), while `v1` builds deploy to `https://arkenv-v1.vercel.app`. We must evaluate how the add-on URL is addressed:

  - **B1a (Recommended S-Tier): Reverse Proxy on `main` (`arkenv.js.org/tanstack/:path*` -> `arkenv-v1.vercel.app`)**:
    - *Mechanism:* Add a 3-line rewrite in `apps/www/next.config.ts` on `main`:
      ```ts
      {
        source: "/tanstack/:path*",
        destination: "https://arkenv-v1.vercel.app/tanstack/:path*",
      }
      ```
    - *Pros:* Complete URL stability from Day 1. The official public command is `tanstack create my-app --add-ons https://arkenv.js.org/tanstack/info.json`. It works immediately, never returns 404, never requires changing URLs when v1 graduates to GA, and never leaves stale preview links in user terminals, bash histories, or blog posts.
    - *Cons:* Requires a minimal, isolated commit to `main` for the Next.js rewrite rule.
    - *Score:* **S-tier**. Highest brand confidence, zero link rot, zero future migration friction.

  - **B1b (Strong A-Tier Fallback): Direct preview URL (`https://arkenv-v1.vercel.app/tanstack/info.json`) with GA 301 Redirect**:
    - *Mechanism:* Expose the preview domain URL during alpha/rc. At GA, switch docs to `arkenv.js.org` and configure a permanent 301 redirect on `arkenv-v1.vercel.app` (or Vercel domain alias).
    - *Pros:* Zero commits to `main` required today. Self-contained entirely within the `v1` branch. Can be automated in MDX docs via `getDocsUrl()`.
    - *Cons:* Publicly advertises a temporary Vercel preview domain in documentation and commands during alpha.
    - *Score:* **A-tier**. Safe and fully functional backup if `main` cannot be touched immediately.

  - **B1c (Alternative): Static Asset Sync to `main` via `sync-main`**:
    - *Mechanism:* Cherry-pick `apps/www/public/tanstack/` onto `main` so `arkenv.js.org` serves the static files natively.
    - *Pros:* Pure static serving with no proxy overhead.
    - *Cons:* High maintenance tax during alpha iteration: every template tweak on `v1` requires re-running `sync-main` to keep `main` in sync.
    - *Score:* **B-tier**. More cumbersome than a proxy rewrite during active alpha development.

- **B2 Published npm package `@arkenv/tanstack-addon`**:
  - *Pros:* Discoverable on npm registry.
  - *Cons:* TanStack CLI's remote add-on loader (`loadRemoteAddOn`) expects an HTTP URL returning compiled JSON with `files: Record<string, string>`, not an npm tarball package name. Npm distribution would require an unpkg/jsdelivr URL wrapper.
  - *Score:* B-tier. Good supplementary distribution, awkward as primary CLI target.

- **B3 GitHub raw content URL**:
  - *Pros:* Works without deploying `www`.
  - *Cons:* Fragile across branch names (`v1` vs `main` vs commit hashes); subject to GitHub raw CDN cache delays and rate limits.
  - *Score:* C-tier. Unreliable for production users.

- **B4 Upstream PR to TanStack CLI built-in catalog**:
  - *Pros:* Gold standard DX. Allows `tanstack create my-app --add-ons arkenv` directly from the terminal menu alongside `t3env`, `drizzle`, `clerk`.
  - *Cons:* Requires upstream review and merge by the TanStack team in `@tanstack/create`. Cannot be completed solely within this repository, but our add-on structure must enable this directly.
  - *Score:* S-tier endgame / A-tier follow-up. We should prepare the exact files TanStack CLI needs so opening the upstream PR is a 5-minute task.

---

### Layer C — Validator Engine & Schema Options

- **C1 ArkType-only (`@arkenv/core` + `arktype`)**:
  - *Pros:* Pure, zero-boilerplate ArkEnv showcase. No prompts during scaffolding.
  - *Cons:* TanStack developers using Zod or Valibot might hesitate if forced into ArkType syntax immediately.
  - *Score:* A-tier simplicity, but misses ArkEnv's modular multi-validator strength.

- **C2 Configurable option via `info.json` (`validator: "arktype" | "zod" | "valibot"`)**:
  - *Pros:* Leverages TanStack CLI's native `options` schema:
    ```json
    "options": {
      "validator": {
        "type": "select",
        "label": "Validator Engine",
        "default": "arktype",
        "options": [
          { "value": "arktype", "label": "ArkType (@arkenv/core) - Recommended" },
          { "value": "zod", "label": "Zod (@arkenv/standard)" },
          { "value": "valibot", "label": "Valibot (@arkenv/standard)" }
        ]
      }
    }
    ```
    Uses `src/env.ts.ejs` to generate either ArkType or Standard Schema syntax. Demonstrates ArkEnv's unique capability: "Bring your own validator".
  - *Cons:* Requires templating `package.json.ejs` and `env.ts.ejs` with EJS conditions.
  - *Score:* S-tier. Perfectly matches ArkEnv's core message and TanStack CLI's interactive capabilities.

- **C3 Standard Schema / Zod-only**:
  - *Pros:* Familiar to Zod users.
  - *Cons:* ArkEnv's primary differentiator is ArkType with 0 runtime dependencies and instant speed. Demoting ArkType hurts the product story.
  - *Score:* C-tier.

---

### Layer D — Scaffolding Assets & Demo Scope

- **D1 Minimal env setup only**:
  - *Pros:* Cleanest project generation. No extra routes to delete.
  - *Cons:* Fails the "Show, Don't Tell" test. A user scaffolded with `t3env` gets `src/env.ts`. ArkEnv has server-key client leakage protection and server function isolation—if there is no route demonstrating it, the user doesn't see why ArkEnv is better.
  - *Score:* B-tier. Useful for blank preset, underwhelming as default.

- **D2 Minimal env setup + Demo Route (`/demo/arkenv`)**:
  - *Pros:* TanStack CLI standard convention! All major TanStack add-ons (`posthog`, `tRPC`, `convex`, `better-auth`) register a demo route under `src/routes/demo/<id>.tsx` and an entry in `info.json` (`routes: [{ url: "/demo/arkenv", name: "ArkEnv Demo", path: "..." }]`). TanStack's home layout automatically shows demo route navigation pills!
  - *Cons:* Creates one demo file in `src/routes/demo/arkenv.tsx` (which TanStack CLI's `tanstack clean-demos` can remove automatically).
  - *Score:* S-tier. Conforms 100% to TanStack CLI ecosystem conventions.

- **D3 Minimal env setup + Demo Route + Interactive Leak Button**:
  - *Pros:* Directly ports the proven component from `examples/with-tanstack-start` and `apps/playgrounds/tanstack-start`: a button that tries to read `env.DATABASE_URL` in the browser and triggers ArkEnv's runtime error overlay.
  - *Cons:* None; can be contained inside the `/demo/arkenv` route file.
  - *Score:* S-tier enhancement to D2.

---

### Layer E — Version Pinning & Release Automation

- **E1 Dynamic sync from `RELEASE_CONFIG` / build script**:
  - *Pros:* Respects the monorepo's v1 release policy (`RELEASE_TAG` in `apps/www/lib/config/release.ts`). During alpha, injects `@arkenv/core@alpha`, `@arkenv/vite-plugin@alpha`. When graduating to `rc` or GA, a single constant update propagates without manual search-and-replace.
  - *Cons:* Requires a build/sync script in the package.
  - *Score:* S-tier. Follows established AGENTS.md v1 rules.

- **E2 Hardcoded pinned alpha versions**:
  - *Pros:* Simple to write initially.
  - *Cons:* Drifts immediately on next release; will cause failed npm installs once versions bump.
  - *Score:* D-tier.

- **E3 Floating `latest` tag**:
  - *Pros:* Works for GA packages.
  - *Cons:* Fatal failure right now because v1 packages publish under `@alpha`, not `@latest`. Npm install would install v0 or fail.
  - *Score:* E-tier (broken during alpha).

---

## Tier list

Solutions ranked as **answers to the whole problem**.

### S-Tier (The Recommended Public Stack)

**Stack: `A1 + B1a + C2 + D2 + E1`** (Fallback: `B1b` if `main` cannot be touched immediately)
- **A1:** Monorepo package `packages/tanstack-addon` containing the source templates, tests, and compilation scripts.
- **B1a:** Official brand URL `https://arkenv.js.org/tanstack/info.json` from Day 1, enabled via a tiny Next.js proxy rewrite on `main` to `https://arkenv-v1.vercel.app/tanstack/:path*`. (Fallback `B1b`: `https://arkenv-v1.vercel.app/tanstack/info.json` in preview docs).
- **C2:** Configurable engine option: ArkType (default), Zod, or Valibot.
- **D2:** Ships `src/env.ts`, `vite.config.ts` integration, `.env.example`, and a demo route at `/demo/arkenv` with an interactive client-leak test.
- **E1:** Automated version injection respecting `RELEASE_TAG` (`alpha` / `rc` / GA).

*Why this is the chosen story:*
It gives developers an instant, zero-friction setup via the permanent URL `tanstack create --add-ons https://arkenv.js.org/tanstack/info.json`. It avoids temporary URLs that rot post-GA, adheres 100% to TanStack CLI architecture, demonstrates ArkEnv's unique runtime safety in a demo route, supports ArkType and Standard Schema, and stays continuously validated in CI with zero drift.

---

### A-Tier (Follow-Up / Upstream Distribution)

- **B4 (Upstream PR to `@tanstack/create`)**:
  - Submit the compiled add-on directory directly to `@tanstack/create/src/frameworks/react/add-ons/arkenv` so users can select `arkenv` in the CLI interactive prompt without providing a URL.
  - *Note:* Do not block the initial release on upstream merge. Ship S-tier (B1a) first, then open the upstream PR using the same compiled asset bundle.
- **B1b (Direct Preview URL)**:
  - If we choose not to touch `main` at all during alpha, use `https://arkenv-v1.vercel.app/tanstack/info.json` directly. The `v1` docs will resolve this automatically via `getDocsUrl()`. At GA, add a 301 redirect.

---

### B-Tier (Alternative / Simpler Fallback)

- **Stack: `A1 + B1 + C1 + D1 + E1`**:
  - Strip options (ArkType-only) and strip demo route (minimal config only).
  - Clean and fast to scaffold, but misses the opportunity to showcase ArkEnv's multi-validator flexibility and interactive safety features.

---

### C-Tier / D-Tier / E-Tier (Rejected)

- **A4 / A5 (Manual static JSON or external repo):** Unacceptable drift and maintenance hazard.
- **B3 (GitHub raw URL):** Unreliable CDN caching and formatting instability.
- **E3 (`latest` tag):** Breaks in current alpha release channel.

---

## S and A usage

### Use Case 1: Scaffolding a new TanStack Start app with ArkEnv

**S (Hosted Custom Add-on):**
```bash
# Developer creates app with ArkEnv add-on
tanstack create my-app --add-ons https://arkenv.js.org/tanstack/info.json

# Interactive prompt asks for validator preference:
# ? Choose Validator Engine:
#   > ArkType (@arkenv/core) - Recommended
#     Zod (@arkenv/standard)
#     Valibot (@arkenv/standard)
```

Generated project structure:
```
my-app/
├── src/
│   ├── env.ts                    # arkenv({ ... }) schema definition
│   └── routes/
│       ├── __root.tsx
│       ├── index.tsx
│       └── demo/
│           └── arkenv.tsx        # Demo route with server vs client leak test
├── vite.config.ts                # arkenv() Vite plugin pre-registered
├── .env.example                  # Starter environment variables
└── package.json                  # @arkenv/core + @arkenv/vite-plugin installed
```

**A (After Upstream Catalog PR Merged):**
```bash
# Once merged upstream into @tanstack/create:
tanstack create my-app --add-ons arkenv
```

---

### Use Case 2: Adding ArkEnv to an existing TanStack project

**S:**
```bash
cd my-tanstack-app
tanstack add https://arkenv.js.org/tanstack/info.json
```

---

### Use Case 3: Local Development & Iteration

In the `arkenv` repository:
```bash
# Build packages and compile TanStack add-on
pnpm --filter @arkenv/tanstack-addon build

# Test against a freshly scaffolded temp project locally
pnpm --filter @arkenv/tanstack-addon test
```

---

## Current lean

1. **Ship now (S stack):**
   - Create `packages/tanstack-addon` with:
     - `.add-on/info.json`: add-on metadata, `options.validator`, `routes`, and `integrations` (vite-plugin).
     - `.add-on/package.json.ejs`: dependencies based on chosen validator and `RELEASE_TAG`.
     - `.add-on/assets/src/env.ts.ejs`: templated schema module supporting ArkType, Zod, and Valibot.
     - `.add-on/assets/src/routes/demo/arkenv.tsx`: interactive demo route with secret leak testing.
     - `.add-on/assets/_dot_env.example`: template `.env.example`.
     - Build script to:
       1. Recursively gather all assets into an in-memory map.
       2. Read metadata and compile into a self-contained JSON schema meeting TanStack CLI's `AddOnCompiledSchema` (including `files: Record<string, string>`, `deletedFiles: []`, and `packageTemplate`).
       3. Output this compiled bundle as `info.json` (for remote CLI loading via `https://arkenv.js.org/tanstack/info.json`) and `add-on.json`.
       4. Recursively sync the complete directory structure (`info.json`, `add-on.json`, `package.json.ejs`, and `assets/`) into `apps/www/public/tanstack/`.
   - Add unit/smoke test in `packages/tanstack-addon` validating against TanStack CLI's schema and verifying that `tanstack create` successfully incorporates the add-on.
   - Update docs (`apps/www/content/docs/frameworks/tanstack-start.mdx`) with the add-on command.

2. **A-tier follow-up:**
   - Open PR against `tanstack/cli` (`packages/create/src/frameworks/react/add-ons/arkenv`) with the compiled assets.

---

## Template specifications

### 1. `info.json`

```json
{
  "id": "arkenv",
  "name": "ArkEnv",
  "version": "1.0.0-alpha.1",
  "description": "Typesafe environment variable validation with build-time validation and runtime leak protection.",
  "type": "add-on",
  "phase": "add-on",
  "category": "tooling",
  "color": "#06B6D4",
  "priority": 28,
  "link": "https://arkenv.js.org",
  "modes": ["file-router", "code-router"],
  "options": {
    "validator": {
      "type": "select",
      "label": "Validator Engine",
      "default": "arktype",
      "options": [
        { "value": "arktype", "label": "ArkType (@arkenv/core) - Recommended" },
        { "value": "zod", "label": "Zod (@arkenv/standard)" },
        { "value": "valibot", "label": "Valibot (@arkenv/standard)" }
      ]
    }
  },
  "routes": [
    {
      "url": "/demo/arkenv",
      "name": "ArkEnv Demo",
      "path": "src/routes/demo/arkenv.tsx",
      "jsName": "ArkEnvDemo"
    }
  ],
  "integrations": [
    {
      "type": "vite-plugin",
      "import": "import arkenv from '@arkenv/vite-plugin'",
      "code": "arkenv()"
    }
  ]
}
```

### 2. `package.json.ejs`

```ejs
<%
  const arkenvOption = (typeof addOnOption !== 'undefined' && (
    addOnOption['arkenv'] ||
    Object.entries(addOnOption).find(([k]) => k.includes('arkenv') || k.includes('info.json'))?.[1]
  )) || {};
  const validator = arkenvOption.validator || 'arktype';
-%>
{
  "dependencies": {
<% if (validator === 'zod') { -%>
    "@arkenv/standard": "^1.0.0-alpha.1",
    "zod": "^3.24.2"
<% } else if (validator === 'valibot') { -%>
    "@arkenv/standard": "^1.0.0-alpha.1",
    "valibot": "^1.0.0"
<% } else { -%>
    "@arkenv/core": "^1.0.0-alpha.1",
    "arktype": "^2.2.0"
<% } -%>
  },
  "devDependencies": {
    "@arkenv/vite-plugin": "^1.0.0-alpha.1"
  }
}
```

### 3. `src/env.ts.ejs`

```ejs
<%
  const arkenvOption = (typeof addOnOption !== 'undefined' && (
    addOnOption['arkenv'] ||
    Object.entries(addOnOption).find(([k]) => k.includes('arkenv') || k.includes('info.json'))?.[1]
  )) || {};
  const validator = arkenvOption.validator || 'arktype';
-%>
<% if (validator === 'zod') { -%>
import arkenv from "@arkenv/standard";
import { z } from "zod";

export const env = arkenv({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  VITE_API_URL: z.string().url().default("https://api.example.com"),
  DATABASE_URL: z.string().url().default("postgresql://postgres:postgres@localhost:5432/db"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});
<% } else if (validator === 'valibot') { -%>
import arkenv from "@arkenv/standard";
import * as v from "valibot";

export const env = arkenv({
  PORT: v.optional(v.pipe(v.unknown(), v.transform(Number), v.integer()), 3000),
  VITE_API_URL: v.optional(v.pipe(v.string(), v.url()), "https://api.example.com"),
  DATABASE_URL: v.optional(v.pipe(v.string(), v.url()), "postgresql://postgres:postgres@localhost:5432/db"),
  NODE_ENV: v.optional(v.picklist(["development", "production", "test"]), "development"),
});
<% } else { -%>
import arkenv from "@arkenv/core";

export const env = arkenv({
  PORT: "number.port = 3000",
  VITE_API_URL: "string = 'https://api.example.com'",
  DATABASE_URL: "string = 'postgresql://postgres:postgres@localhost:5432/db'",
  NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});
<% } -%>
```

### 4. `src/routes/demo/arkenv.tsx`

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { env } from "../../env";

const getDatabaseConfig = createServerFn({ method: "GET" }).handler(() => {
  // Server-only key: safely read on the server during SSR / RPC
  try {
    const url = new URL(env.DATABASE_URL);
    return { host: url.host, protocol: url.protocol };
  } catch {
    return { host: "localhost:5432", protocol: "postgresql:" };
  }
});

export const Route = createFileRoute("/demo/arkenv")({
  component: ArkEnvDemo,
  loader: () => getDatabaseConfig(),
});

function LeakedSecret() {
  // Accessing server-only DATABASE_URL directly on the client throws at runtime
  return <p>Server key leaked: {env.DATABASE_URL}</p>;
}

function ArkEnvDemo() {
  const dbConfig = Route.useLoaderData();
  const [attemptLeak, setAttemptLeak] = useState(false);

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4 font-sans">
      <h1 className="text-2xl font-bold">ArkEnv Demo</h1>
      <p className="text-sm text-gray-600">
        Typesafe environment variables with build-time validation and runtime leak protection.
      </p>

      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md space-y-2">
        <h2 className="font-semibold text-lg">Public Client Variables</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">Inlined safely into client bundles:</p>
        <code className="block p-2 bg-white dark:bg-black rounded border text-xs font-mono">
          env.VITE_API_URL: {env.VITE_API_URL}
        </code>
      </div>

      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md space-y-2">
        <h2 className="font-semibold text-lg">Server-Only Variables</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">Accessible inside createServerFn handlers:</p>
        <code className="block p-2 bg-white dark:bg-black rounded border text-xs font-mono">
          Database Host: {dbConfig.host} ({dbConfig.protocol})
        </code>
      </div>

      <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md space-y-2">
        <h2 className="font-semibold text-red-800 dark:text-red-300 text-lg">Secret Leak Protection</h2>
        <p className="text-sm text-red-700 dark:text-red-400">
          Clicking the button below attempts to access the server secret <code>env.DATABASE_URL</code> on the client, which ArkEnv blocks:
        </p>
        {attemptLeak ? (
          <LeakedSecret />
        ) : (
          <button
            type="button"
            className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 cursor-pointer"
            onClick={() => setAttemptLeak(true)}
          >
            Attempt client access to DATABASE_URL
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## Changelog of this note

- 2026-09-05: Initial write-up of TanStack CLI add-on evaluation note using `/the-hat` methodology.
- 2026-09-05: Added exact template specifications (`info.json`, `package.json.ejs`, `src/env.ts.ejs`, `src/routes/demo/arkenv.tsx`), clarified `info.json` remote compilation schema, and resolved EJS addOnOption ID targeting for remote and upstream modes.

