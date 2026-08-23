# Project context

## Purpose

ArkEnv is a typesafe environment variable parser powered by [ArkType](https://arktype.io/), TypeScript's 1:1 validator. The project provides:

- **Zero external dependencies** (except peer dependencies)
- **Typesafe environment variables** with build-time and runtime validation
- **Tiny bundle size** (\~2 kB gzipped goal)
- **Cross-platform support** for Node.js, Bun, and browser environments
- **Vite plugin** for build-time validation
- **Single import, zero config** for most projects

The main goal is to provide a developer-friendly way to validate and type-check environment variables using familiar TypeScript-like syntax, ensuring applications fail fast with clear error messages when environment variables are missing or invalid.

## Language

**Env object**:
The imported validated environment object (`import { env } from "./env"`). This is the **canonical surface** across Next, Nuxt, Vite, and Bun — client and server.
*Avoid*: treating `import.meta.env` / `process.env` as the recommended ArkEnv API

**Transform** (also **transformation**):
Schema-agnostic reshape of a validated env value (trim, clamp, map, normalize) during validation. Prefer this word in ArkEnv docs, skills, and issue language whenever the behavior is not tied to one schema library. Docs show ArkType and Standard Schema (Zod, …) examples side by side as first-class paths.
*Avoid*: using **morph** as the default product term for this idea; treating `@arkenv/standard` / Zod as an afterthought section

**Morph**:
ArkType’s name for a **transform** (`.pipe` morphs; ArkType docs also say “transformation”). Use when talking about ArkType APIs or linking to [ArkType morphs](https://arktype.io/docs/intro/morphs-and-more). Zod’s parallel is `.transform`; Valibot uses pipe/transform helpers.
*Avoid*: treating Morph as ArkEnv’s cross-validator vocabulary

**Coercion**:
ArkEnv’s pre-validation step that turns raw env strings into numbers, booleans, arrays, and objects before the schema library runs. Distinct from a **transform**: coercion is ArkEnv-owned and schema-introspected; transforms are declared on the field schema. Applies to both `@arkenv/core` and `@arkenv/standard`.
*Avoid*: calling coercion a morph/transform, or calling a Zod `.transform` “coercion” unless the library’s own coerce helpers are meant

**toJsonSchema** (escape hatch):
Optional `@arkenv/standard` config callback that supplies JSON Schema for **coercion** when a Standard Schema library keeps conversion off the value (Valibot, Zod Mini, Zod v3). Fallback after on-value probes. Parameter is `StandardSchemaV1`; assert at the host converter.
*Avoid*: per-key wrappers as the happy path; Valibot/Mini helpers or peers on `@arkenv/standard`; auto-detect by `vendor`; a bare `{ toJsonSchema }` function reference as the documented Valibot path

**Engine** (`@arkenv/core` / `@arkenv/standard`):
The two first-class validation entry points. Same `arkenv()` runtime options, errors, and framework plugins; different schema authoring style and peers. Prefer dual examples (Tabs) in docs over core-first prose with a Standard Schema appendix.
*Avoid*: framing Standard Schema as migration-only or second-class

**Schema/define path**:
The legacy v0 pattern (`arkenv(schema)` plugin argument with native-accessor `define` rewriting and ambient `.d.ts` augmentations). Dropped in v1 (ADR 0021, #1333) in favor of the unified `import { env } from "./env"` object surface across all frameworks.
*Avoid*: recommending schema/define or ambient `.d.ts` augmentations in v1 docs, CLI, or skills; framing SPA mode as a supported v1 path

### Site chrome (www)

**Logo top-left**:
Axiom for www chrome — the brand mark sits at the start of **Site Nav** (top-left of the floating bar), on home, docs, and orphans. The chrome may change form or extras; the logo’s page-corner role does not.
*Avoid*: centered floating chrome that moves the logo away from the top-left; a third orphan-only placement

**Glass material**:
The shared translucent surface language for site chrome — hairline border, soft shadow, backdrop blur/saturation — inspired by iOS liquid glass.
*Avoid*: treating home and docs as separate visual systems; “frosted glass” as a distinct product term

**Site Nav**:
The primary site-wide navigation chrome for [www](http://www). One header everywhere: **Glass material**, **Floating bar**, **logo top-left**, centered **Nav core** links, theme + GitHub on the right, then a shared right **action pill**. Owned as www site chrome — not a generic docs-kit primitive.
*Avoid*: Header (when meaning the whole site chrome); separate home vs docs chrome families; centered content-sized pill; publishing Site Nav as `@arkenv/fumadocs-ui` API; search on home

**Nav core**:
The shared **Site Nav** contents on every surface and breakpoint: primary links **Docs**, **Playground** (StackBlitz, external, with an up-right icon), and **Roadmap** (external, with an up-right icon), centered in the bar; plus theme and GitHub on the right. On small screens the primary links live in a hamburger menu.
*Avoid*: Demo as an in-page `#demo` section; Why ArkEnv? / Presets as core links; Get started or Search as core links; “Documentation” as a separate label from **Docs**; Roadmap or Playground without an external-link affordance

**Action pill**:
The shared rightmost control slot in **Site Nav** — identical height, min-width, padding, and capsule radius. Home/orphan fills it with **Get started**; docs fills it with **Search**. Not both.
*Avoid*: differently sized Get started vs Search; search on home; Get started on docs

**Floating bar**:
The shared **Site Nav** geometry — inset from the top and sides, capsule pill radius, **logo top-left**, bounded by the page column (`--fd-layout-width`) so it does not stretch edge-to-edge on ultrawide. On docs, the logo sits above the left sidebar. Uses **Glass densify** on scroll on every surface. Positioned with sticky + absolute (not `position: fixed`) so glass blur can sample page content.
*Avoid*: viewport-wide chrome on ultrawide; edge-to-edge top strip; solid-at-rest / glass-after-scroll swap; Fumadocs default nav as the lasting design intent

**Menu panel**:
The solid full-viewport sheet opened by the **Site Nav** hamburger on small screens. Temporary takeover for choosing a destination; not glass.
*Avoid*: glass mobile drawer; merging with the docs sidebar drawer

**Glass densify**:
A scroll-driven increase in **Glass material** opacity/blur so content sliding under the **Floating bar** stays readable, without ever dropping to a solid non-glass rest state.
*Avoid*: opaque header; binary solid↔glass swap

## Relationships

- **Site Nav** is the same header on home, docs, and orphans
- **Logo top-left**; **Nav core** links centered; theme + GitHub then the **action pill** on the right
- Home/orphan **action pill** = **Get started**; docs **action pill** = **Search** (same footprint)
- Docs still mounts a mobile sidebar trigger (tree access) without changing the shared chrome layout
- **Roadmap** is part of **Nav core** (external link with icon)
- **Glass densify** applies on every surface
- The hamburger **menu panel** is a solid full-viewport sheet
- **Site Nav** is www-owned; package `Header` is removed when it ships
- **Coercion** runs before schema validation; a **transform** (ArkType **morph**, Zod `.transform`, …) runs as part of the schema
- Prefer **transform** in product language; reserve **morph** for ArkType-specific discussion
- **toJsonSchema** is `@arkenv/standard` only; `@arkenv/core` introspects ArkType JSON Schema without that callback

## Flagged ambiguities

- **"SPA mode"** (#1105 / canonical env-object ADR) — **resolved** (#1333 / ADR 0021 amendment): Option 3 (Remove / don't offer) adopted for v1. Schema/define path and ambient `.d.ts` augmentations are dropped; `import { env } from "./env"` is the sole canonical surface across all frameworks. SPA mode is not a supported v1 path. (On `v1`, ADR **0021** is the canonical env object record; ADR **0015** is Next.js conditional exports. On `dev` the canonical env object remains `0015-env-object-canonical-surface`.)
- **"Header"** / home vs docs chrome — resolved: one **Site Nav**; home/docs differ only by **action pill** contents (Get started vs Search).
- **Package `Header` vs www chrome** — resolved: **Site Nav** lives in www; package `Header` removed (alpha; www was the only consumer).
- **Centered home pill vs logo top-left** — resolved: shared **Floating bar**, logo top-left, links centered.

## Example dialogue

> **Dev:** "Should home and docs keep slightly different headers?"
> **Domain expert:** "No — one **Site Nav**. Logo left, links centered, GitHub right. The last control is an **action pill**: Get started on home, Search on docs — same size."
>
> **Dev:** "Where does Roadmap go?"
> **Domain expert:** "In **Nav core**, with an external icon — same on every surface."

## Tech stack

### Core technologies

- **TypeScript 6** - Primary language with strict type checking
- **ArkType 2** - Type validation library (peer dependency)
- **pnpm 11** - Package manager for monorepo
- **Turborepo 2** - Monorepo build system and task orchestration

### Build & development tools

- **tsdown 0.16** - TypeScript bundler for packages
- **Biome 2** - Linting and formatting (replaces ESLint/Prettier)
- **Vitest 4** - Unit and integration testing framework
- **Playwright 1.56** - End-to-end testing for www application

### Applications

- **Next.js 16** - Documentation site (www app)
- **React 19** - UI framework for documentation
- **Vite 8** - Build tool for vite-plugin package and playgrounds
- **Bun** - Alternative runtime (supported via examples and playgrounds)

### Infrastructure & services

- **Changesets** - Version management and changelog generation
- **Sentry** - Error tracking for www application
- **Vercel Analytics** - Analytics for documentation site

## Project conventions

### Code style

**Formatting & Linting:**

- Uses **Biome** for all formatting and linting (no ESLint/Prettier)
- **Indentation**: Tabs (not spaces)
- **Quotes**: Double quotes for strings
- **Imports**: Auto-organized by Biome

**TypeScript Conventions:**

- Prefer `type` over `interface` for type definitions
- Use TypeScript 5.1+ features (const type parameters, etc.)
- Avoid explicit types when TypeScript can infer them (`noInferrableTypes` error)
- Use `as const` for immutable values (`useAsConstAssertion` error)
- Use JSDoc comments for public APIs

**Naming Conventions:**

- **Files**: kebab-case (`arkenv.ts`)
- **Functions**: camelCase
- **Types**: PascalCase (`ArkEnvError`)
- **Constants**: UPPER_SNAKE_CASE for environment variables

**Code Quality Rules:**

- Don't reassign function parameters (`noParameterAssign` error)
- Place default parameters last (`useDefaultParameterLast` error)
- Always initialize enum values (`useEnumInitializers` error)
- Use self-closing JSX elements (`useSelfClosingElements` error)
- Declare one variable per statement (`useSingleVarDeclarator` error)
- Prefer `Number.parseInt` over global `parseInt` (`useNumberNamespace` error)
- Console usage is a warning (allowed in `scripts/` and examples/playgrounds)

### Architecture patterns

**Monorepo Structure:**

- **Packages** (`packages/`) - Published npm packages
  - `@arkenv/core` - Core library package with native ArkType support
  - `@arkenv/standard` - ArkType-free Standard Schema entrypoint
  - `@arkenv/vite-plugin` - Vite plugin package
  - `@arkenv/bun-plugin` - Bun plugin package
  - `@arkenv/nextjs` - Next.js integration package
  - `@arkenv/nuxt` - Nuxt integration package
  - `arkenv` - Interactive CLI for scaffolding and project mutation
- **Apps** (`apps/`) - Applications and testing suites (not published)
  - `www` - Next.js documentation site
  - `playgrounds/*` - Test playgrounds for different runtimes
  - `playwright-www` - Playwright E2E tests for the www application
  - `dash` - Optional maintainer Dashfy dashboard (GitHub + npm). Not in CI.
- **Examples** (`examples/`) - Standalone example projects

**Package Architecture:**

- **Core Packages**:
  - **`@arkenv/core`**:
    - Main export: `arkenv` function (also exported as default export)
    - Uses ArkType's `scope` system for type validation
    - Custom types: `string.host`, `number.port`, `boolean`
    - Error handling via `ArkEnvError` class
    - Zero external dependencies (except `arktype` as peer dependency)
  - **`@arkenv/standard`**:
    - Main export: `arkenv` function (also exported as default export)
    - Zero external dependencies; validates environment variables using Standard Schema (Zod, Valibot, etc.)

**Build System:**

- Turborepo for task orchestration and caching
- `tsdown` for building packages (generates ESM + CJS + types)
- Size limits enforced via `size-limit` (\~2 kB per package)
- Workspace protocol (`workspace:*`) for internal dependencies

**Module Resolution:**

- Requires modern TypeScript module resolution:
  - `moduleResolution: "bundler"` (recommended for modern bundlers)
  - `moduleResolution: "node16"` or `"nodenext"` (for Node.js projects)

### Testing strategy

**Testing Philosophy:**

- **"Examples as Test Fixtures"** - Examples serve as both documentation and test fixtures
- **"Test the User Journey"** - E2E tests validate complete workflows
- **"Test behavior, not aesthetics"** - Focus on public API and user behavior

**Test Types:**

1. **Unit Tests** (`*.test.ts`) - Fast, isolated tests with mocked dependencies
2. **Integration Tests** (`*.integration.test.ts`) - Test multiple units working together
3. **Fixture-Based Tests** - Use real example projects as test fixtures (vite-plugin)
4. **End-to-End Tests** - Playwright tests for www application across browsers

**Test Organization:**

- Co-locate tests: `Component.tsx` next to `Component.test.tsx`
- Use Testing Library + user-event for component tests
- Query by role, name, label, and text (accessibility first)
- Mock at component boundaries (network, time, context)

**Running Tests:**

```bash
pnpm test -- --run                    # All tests
pnpm test --project arkenv -- --run  # Specific package
pnpm test -- --run "integration"     # Integration tests only
pnpm run test:e2e                     # E2E tests
```

### Git workflow

**Branching:**

- Create feature branches from `dev`
- `dev` is the default branch and continuous integration target
- **Base Branch & Comparisons**: Always use `origin/dev` (not `main` or `origin/main`) for any `git diff` checks, branch bases, or code comparisons unless explicitly instructed otherwise.
- **PR Target Branch**: When opening a Pull Request (via `gh pr create` or the GitHub UI), always ensure the target base branch is set to `dev` (which is the default on GitHub), unless you are specifically applying a documentation hotfix directly to `main`.
- `main` is the production release branch, updated only after a successful npm publish
- The documentation site (`apps/www`) deploys strictly from `main` to prevent unreleased features from appearing live
- To make immediate typo or cosmetic fixes to the live docs without a package release, push directly to `main` and use the `sync-main` workflow/skill to cherry-pick and reconcile those changes back into `dev`
- Use descriptive branch names

**Versioning:**

- Uses **Changesets** for version management
- Create changeset with `pnpm changeset` before committing
- Changesets are in `.changeset/` directory
- Only published packages (`packages/*`) require changesets
- Examples and private applications don't need changesets

**Commits:**

- Commit changeset file along with code changes
- Changesets automatically generate changelogs and version bumps

**Publishing:**

- Run `pnpm release` after merging PRs to publish packages
- Only packages in `packages/` are published to npm

## Design Decisions

**Split Parsing Engines (ArkType vs Standard Schema):**

- ArkEnv maintains two distinct parsing engines: `src/arktype/index.ts` and `src/parse-standard.ts`.
- Despite visual similarities, they are strictly isolated to guarantee the `arkenv/standard` module boundary remains "ArkType-free".
- Unifying them would force bundlers to trace static imports and drag ArkType into the dependency tree of Standard Schema users, violating the zero-dependency goal.
- We prioritize optimal tree-shaking, bundle size isolation, and decoupling over dogmatic DRYness.

**Docs framing for Standard Mode:**

- Framework intros must not say the integration "requires ArkType". Users install either `@arkenv/core` (+ `arktype`) or `@arkenv/standard` (+ their validator).
- "Zod, Valibot, and other Standard Schema validators" pages lead with Standard Mode (`@arkenv/*/standard`); mixing validators into the ArkType path is secondary.
- FAQ coverage: sharpen the core FAQ (“Do I have to use ArkType?”) and add matching Next/Nuxt FAQ entries that point at `/standard` install + the validators pages.
- Nuxt docs treat **flat layout** as the canonical DX layout (not “simple”). Validators examples and the Nuxt intro card should point at flat. The leftover `layouts/simple.mdx` page was removed; `/docs/nuxt/layouts/simple` permanently redirects to `/docs/guides/frameworks/nuxt`.
- Next.js Standard Mode docs lead with the **codegen** happy path (`import arkenv from "./generated/env.gen"`); direct `@arkenv/nextjs/standard` + manual `runtimeEnv` is documented as the no-codegen alternative.
- Same “does not require ArkType” framing applies lightly to Vite and Bun intros (remove the requires-ArkType callout; keep Standard install path). Fumadocs titled callouts use `:::important[Title]` / `:::tip[Title]`, not a bare `:::important` with the title as body text.
- Package READMEs (`@arkenv/nextjs`, `@arkenv/nuxt`): light touch only — mention Standard Mode + `/standard`; no full README rewrite in this pass.
- On validators pages, the secondary “Mixing with ArkType” section is short: one flat-layout mixed schema example; no full Zod/Valibot × flat/strict tab matrix.
- Core FAQ: keep “Do I have to use ArkType?” for validator choice; add a dedicated “Do I need to install `arktype`?” for the `@arkenv/standard` / `/standard` packaging story.
- Validators page descriptions (and intro cards): “Use Zod, Valibot, or any Standard Schema validator — with or without ArkType.” Title stays “Zod, Valibot, and other Standard Schema validators.” Core `integrations/standard-schema` remains the mix-with-`@arkenv/core` guide.
- Nuxt FAQ gets peer-engine parity with Next (“Why install `@arkenv/core` or `@arkenv/standard` alongside `@arkenv/nuxt`?”) plus the dedicated arktype-install FAQ on both framework FAQs.

## Domain context

### Language (env surfaces & Nuxt transport)

**Canonical env object**:
The imported `env` object (`import { env } from "./env"`) is the one supported way to read validated env across Next, Nuxt, Vite, and Bun.
*Avoid*: treating `import.meta.env` / ambient `.d.ts` as a second canonical surface (that is **SPA mode** only)

**SPA mode**:
Vite/Bun-only path that keeps plugin + native accessors + `.d.ts`; honest for static access, not the default fullstack surface.
*Avoid*: “plugin-env as equal peer to the object surface”

**Vite transform mode**:
Client-graph rewrite of `env.ts` that inlines build-validated coerced literals and strips the validator (Solid Start / `#1328` shape). Values are fixed at **build time**.
*Avoid*: calling this “boot-time validation”

**Nitro boot override**:
A `NUXT_PUBLIC_*` / `NUXT_*` value applied by Nitro as a string when the server starts, after the Vite build, which can differ from build-time env.
*Avoid*: “runtimeConfig default”, “build-time public env” (those are earlier stages)

**Deploy-time override honesty** (resolved):
For `@arkenv/nuxt`, coerced values after **Nitro boot overrides** are the source of truth on both server and client. A pure **Vite transform mode** cannot be Nuxt’s sole public-value transport, because it would freeze build-time literals and lie when overrides differ.

**Nuxt honesty transport** (resolved — direction A):
Nitro boot-time coercion writes coerced schema values into `runtimeConfig` (including `public`) after **Nitro boot overrides**; the client **Canonical env object** is a thin reader of that payload with no validator. No Solid-Start-style client-graph literal inlining for Nuxt.
*Avoid*: hybrid Vite-literal + Nitro dual sources of truth; “make Nuxt like #1328”

**Thin client path** (resolved):
Same userland import (`./env` / `@arkenv/nuxt` client entries). On the client, `arkenv` does not run `createEnv` / ship the validator; it reads the already-coerced public payload and keeps server-key guards. No separate virtual client module for users to import.
*Avoid*: “client imports `arkenv/gen/...`”; second client specifier as the default DX

**Nuxt boot gate** (resolved):
A Nitro plugin registered by `@arkenv/nuxt/module` is the single validation/coercion gate after **Nitro boot overrides**. It writes coerced values into `runtimeConfig` (including `public`). Server and client **Canonical env object** accessors then read that coerced config; they must not re-validate from raw `process.env` / string overrides in a way that can disagree with the gate.
*Avoid*: dual `createEnv` (import-time + Nitro); “validate in `env.ts` then hope it runs after overrides”

**Symmetric thin accessors** (resolved):
On Nuxt, both server and client `arkenv()` paths are thin readers of the coerced `runtimeConfig` / payload after the **Nuxt boot gate**. `createEnv` runs in the gate, not in userland `env` imports on either side.
*Avoid*: “server still validates on import, client is thin”; asymmetric honesty

**Boot gate schema load** (resolved):
The module loads the configured `schemaPath` / strict layout files and the **Nuxt boot gate** (and build-time validate) call **core** validation against that schema. Public thin `arkenv()` is never used as the validator entry.
*Avoid*: requiring a user-exported `schema`; validating by side-effect of executing fat `arkenv()` in `env.ts`

**Boot gate scheduling** (resolved):
Eager Nitro plugin at server startup for fail-fast, plus idempotent `ensureBootGate()` that thin *server* `arkenv()` may call if it runs first. Single `createEnv` (once). Client never runs the gate — it only reads the post-gate payload.
*Avoid*: lazy-only gate; dual independent `createEnv` calls

**Client validator isolation** (resolved):
`@arkenv/nuxt` client entries must not import `@arkenv/core` / `arktype`. Default ArkType string schemas are plain data. No Vite transform for stripping or inlining. Userland imports of `type` / Zod / other validators into a client-imported env module are the user’s bundle cost.
*Avoid*: “rewrite env.ts to guarantee a validator-free graph”; blaming the integration for user-imported validators

**Build-time schema check** (resolved):
Module setup / `nuxt build` may still run core validation against the build environment when `validate: true` (opt out with `validate: false`). This is an early CI/dev check only. Deploy-time honesty — including **Nitro boot overrides** — remains the **Nuxt boot gate**. Implementation must call core directly, not thin `arkenv()` side effects.
*Avoid*: treating build-time validate as proof of production env; removing the check because the boot gate exists

**Flagged ambiguities**

- “Completely Vite-plugin-based like Solid Start” for Nuxt — **resolved: no** as the sole public-value transport. Nuxt keeps a Nuxt module + **Nuxt boot gate** + **symmetric thin accessors**; Vite is only for the compile-time import boundary (ADR 0016), not Solid-Start-style value inlining. See [#1424 design call](https://github.com/yamcodes/arkenv/issues/1424#issuecomment-5038256349).

**Relationships**:

- A **Nitro boot override** happens after Vite build and before the `__NUXT__` / `runtimeConfig` payload is served to the client
- **Vite transform mode** is appropriate for hosts whose public env is build-time (e.g. Solid Start); it is not sufficient alone for Nuxt
- **Canonical env object** is shared; the *transport* that materializes client values is host-specific
- On Nuxt, the **Nuxt honesty transport** owns public client values; the existing Vite plugin remains for the compile-time import boundary only (not value transport)
- The **Nuxt boot gate** runs after **Nitro boot overrides** and before honest **Canonical env object** reads on either side
- **Boot gate scheduling** ensures the gate precedes thin server reads; the serialized public payload then precedes thin client reads
- **Client validator isolation** is a package-entry concern, not a transform-mode concern, on Nuxt
- The **Build-time schema check** is optional early feedback; it does not replace the **Nuxt boot gate**

**Example dialogue**:

> **Dev:** “Can we make Nuxt completely Vite-plugin-based like Solid Start?”
> **Domain expert:** “Not as the only transport. Solid Start’s public keys are build-time; Nuxt’s can change via a **Nitro boot override**. Honesty requires the **Nuxt honesty transport** — the **Nuxt boot gate** (module-loaded schema, **boot gate scheduling**) coerces into `runtimeConfig` after that override, then **symmetric thin accessors**. The Vite plugin stays for import blocking; **client validator isolation** is a thin package entry, not a #1328-style rewrite. Keep the **Build-time schema check** for CI, but don’t confuse it with deploy honesty.”

### Docs site navigation

Language for the documentation website (`apps/www`) nav chrome. See **ADR 0022** (desktop) and **ADR 0026** (mobile).

**Drill-in Sidebar**:
The **desktop** docs sidebar: opening a **Section** replaces the current list with that section’s children, instead of expanding them inline.
*Avoid*: Accordion / **Sidebar Tree** for the desktop root↔section transition; paged sidebar (informal)

**Sidebar Tree**:
The **mobile** docs drawer: every **Section** stays on one list and expands in place (title → **Overview**, chevron toggles children). No **Sidebar Page**, no Back.
*Avoid*: Drill-in (in the mobile drawer); calling this a dropdown

**Sidebar Page**:
One full list view inside a **Drill-in Sidebar** (root index, or the contents of one **Section**). Desktop only.
*Avoid*: Panel, screen, view (when referring to sidebar navigation state)

**Section**:
A root-level folder in the docs page tree. On desktop it drills into its own **Sidebar Page** (trailing chevron). On mobile it expands in the **Sidebar Tree**. Drill-in is one level only.
*Avoid*: Category, group, accordion, folder (in UX copy)

**Nested Folder**:
A real folder under a **Section** (true URL depth n=2, e.g. `/docs/guides/frameworks/nextjs`). Does not drill: title navigates to the folder’s overview page; a separate chevron toggles **indented** child **Leaves** (starts expanded). Max one Nested Folder level inside a Section (no n=3). Same on desktop **Sidebar Page** and mobile **Sidebar Tree**.
*Avoid*: Nested Group (retired — conflated with Separator), Section (root only), sub-section (vague)

**Leaf**:
A sidebar item that navigates to a docs URL without changing **Sidebar Page** (desktop) or expanding a folder (mobile).
*Avoid*: Link item, page link (when contrasting with Section)

**Overview**:
The index page of a **Section**. On desktop it is listed first on that section’s **Sidebar Page**. On mobile the **Section** title itself navigates here (no extra Overview row). Opening a **Section** on desktop navigates here so a **Leaf** is always selected.
*Avoid*: Section landing (informal), index (when speaking in UX terms)

**External Leaf**:
A **Leaf** that leaves the docs site (external URL), shown with an external-link affordance.
*Avoid*: Outlink (unless needed in code)

**Separator**:
A non-interactive muted label that only **groups** sibling **Leaves** under a **Section** (from meta `---Label---` entries). URLs stay flat under the **Section** (n=1), e.g. `/docs/reference/system-environment-variables` with a “Configuration” label above — not a Nested Folder. Page-header taglines treat these as Section-only (`X`), never `X > Y`.
*Avoid*: Nested Folder, divider, heading (when referring to nav chrome)

**Relationships**:

- **Desktop** uses a **Drill-in Sidebar** (exactly one **Sidebar Page** at a time). **Mobile** uses a **Sidebar Tree** (all **Sections** on one list; expand in place)
- Only **Sections** (root folders) open a child **Sidebar Page** on desktop; Back returns to the root **Sidebar Page**. Mobile has no Back
- Inside a **Section**, authors choose **Nested Folder** (true n=2 URL + collapsible indented children) or **Separator** (visual group only, flat URLs) — same on both surfaces
- **Nested Folders** are at most one level inside a **Section** (n=2 max); they collapse/expand and do not drill
- **Sidebar Page** selection is **URL-driven** on load and when the docs URL changes
- Every **Section** has an **Overview** index. Desktop: clicking a **Section** opens that Overview (drill + navigate) so a **Leaf** is always selected. Mobile: the **Section** title is that Overview link
- **Leaf** clicks change the URL. Desktop Back returns to the root **Sidebar Page** without changing the URL
- **Changelog** is an **External Leaf** to GitHub Releases; no Glossary **External Leaf** until a glossary exists

**Example dialogue**:

> **Dev:** "If Guides has a Continuous Integration folder under it, do we drill in again?"
> **Domain expert:** "No. Guides is the **Section**. Continuous Integration is a **Nested Folder** — collapsible header, indented children, URL like `/docs/guides/ci-vendors/vercel`. API reference’s “Configuration” label is a **Separator** over flat pages — not the same thing."

> **Dev:** "Should the mobile drawer drill into Guides the way desktop does?"
> **Domain expert:** "No. Mobile is a **Sidebar Tree** — Guides expands in place. Drill-in is the desktop rail only (ADR 0026)."

**Flagged ambiguities**:

- "paged sidebar" → **Drill-in Sidebar** / **Sidebar Page** (desktop)
- "accordion" / "dropdown" on mobile → **Sidebar Tree**
- "n=2" / "Nested Group" → **Nested Folder** (URL depth) vs **Separator** (visual only)
- Visual direction is **hybrid**: Turbo structure/motion/active-pill; ArkEnv color tokens
- Sidebar Install banner removed; use **Separators** for flat reference groupings and **Nested Folders** only when the URL is truly nested

### Environment Variable Validation

- ArkEnv uses ArkType's type system to validate environment variables
- Schema is defined using TypeScript-like syntax (e.g., `"string.host"`, `"number.port"`)
- Validation happens at both build-time (via Vite plugin) and runtime
- Missing or invalid variables throw `ArkEnvError` with clear error messages

**ArkType Integration:**

- Uses ArkType's `scope` system to extend base types
- Custom types defined in `scope.ts`:
  - `string.host` - Validates IP addresses or "localhost"
  - `number.port` - Validates port numbers (0-65535)
  - `boolean` - Validates boolean values
- The `$` variable naming convention is used for the root scope (ArkType convention)

**Framework & Runtime Integrations:**

- **Vanilla**: The default runtime-only core module for Node.js, Bun, and Deno. Uses `import { env } from "./env"`. Validated environment variables are accessed directly from the returned `env` object for typesafety. Primarily used for **server-side** or runtime-only validation. No plugins are required.
- **Vite**: Integrated via `@arkenv/vite-plugin`. Validates environment variables at build-time and inlines `import.meta.env` variables for **client-side** (browser) usage.
- **Next.js**: Integrated via `@arkenv/nextjs`. Provides two layout patterns:
  - **Strict layout**: Uses separate environment files for client, server, and shared scopes (`env/client.ts`, `env/server.ts`, and `env/internal/shared.ts`) for compile-time locking of secrets from browser bundles using package conditional exports (`react-server` vs. `default`) and `server-only`.
  - **Flat layout** (also called simple layout in older docs): Uses a single `env.ts` schema file. In Next.js, client-side environment variables must be statically destructured in a `runtimeEnv` block to allow static inlining by the Next.js compiler. To automate this, `@arkenv/nextjs/config` exposes a `withArkEnv` wrapper for `next.config.js` that performs static analysis on `env.ts` to locate `client` and `shared` keys, then automatically generates a tailored `arkenv` factory in `generated/env.gen.ts` that pre-fills `runtimeEnv`. It enforces strict client-side prefixing (`NEXT_PUBLIC_`) and prevents server secrets from leaking to client components.
  - **Standard Mode**: Import from `@arkenv/nextjs/standard` (peer: `@arkenv/standard`). ArkType is not required. Flat and strict layouts are both supported.
- **Nuxt**: Integrated via `@arkenv/nuxt`. Exposes a Nuxt module (`@arkenv/nuxt/module`) that:
  - Automates environment variable validation and codegen (for both simple/flat and strict layouts) during development (with file watching) and build.
  - Dynamically populates Nuxt's `runtimeConfig` with environment variable keys defined in the schema.
  - Registers a Vite plugin during client bundling to prevent client-side code from importing `@arkenv/nuxt/server` (compile-time security).
  - Enforces client-side environment variable prefixing (`NUXT_PUBLIC_`).
  - **Standard Mode**: Register `@arkenv/nuxt/standard/module` and import from `@arkenv/nuxt/standard` (peer: `@arkenv/standard`). ArkType is not required. Flat and strict layouts are both supported.
- **Bun fullstack dev server**:
  - **Bun.serve**: An HTTP server runtime that integrates with Bun's built-in bundler to scan HTML files, trigger on-demand bundling, and serve resulting assets. It does not perform bundling itself; rather, it coordinates with Bun's bundler (configured via `@arkenv/bun-plugin` in `bunfig.toml`) to inline environment variables (e.g., using a `PUBLIC_` prefix) via static replacement. Primarily used for **client-side** bundling integration.
  - **Bun.build**: Bun's programmatic bundling API. Integrated via `@arkenv/bun-plugin` in the `Bun.build` plugins array. Used for custom build scripts targeting the browser in a fullstack context.

**Preferred Bun Vocabulary:**

- **Bun fullstack dev server**: also known as "Bun development server", the unified terminology for Bun applications that involve frontend bundling or integrated dev servers.
  - **Bun.serve**: The unified Bun process that handles both API routes and integrated frontend bundling.
  - **Bun.build**: The programmatic API for creating custom frontend build pipelines.
- **Frontend / Client-side**: Code intended to run in the browser, where environment variables must be **inlined** during bundling.
- **Backend / Server-side**: Code running in the Bun runtime, where environment variables are accessed directly from the environment.
- **Static Inlining**: The process where a bundler replaces `process.env.VAR` with a literal value. In Bun, this is configured via the `env` option in `bunfig.toml` or `Bun.build`.

**Type System:**

- Uses `const` type parameters for better type inference
- Leverages ArkType's `type.infer` and `type.validate` utilities
- Typesafe environment object returned from `arkenv`

**Error Handling & Vocabulary:**

- **Issue vs. Error Distinction**: ArkEnv strictly differentiates between an "Issue" and an "Error".
  - **Issue (`EnvIssue`)**: A single, isolated validation failure on a specific environment variable.
  - **Error (`ArkEnvError`)**: The overarching runtime exception that is thrown when validation fails. It contains an array of `EnvIssue`s.
- Functions dealing with individual failures should use "Issue" (e.g., `formatIssues`), while functions dealing with the final halting exception should use "Error" (e.g., `ArkEnvError`).
- `ArkEnvError` extends `Error` and formats ArkType validation errors
- Errors include variable names and expected types
- Fail-fast approach: app won't start if validation fails
- **Boundary access error**: A native `Error` thrown when client code reads a server-only env key (Next.js, Nuxt, Vite, Bun). It is **not** an `ArkEnvError` instance — client-generated modules must stay import-free of the class, and there are no `EnvIssue`s. Leave `error.name` as `"Error"`. Message uses Next.js taint voice: `Do not access server-only key '${key}' on the client since it will leak sensitive data (prevented by ArkEnv)` (no trailing period). Do not catch this throw; fix the access. Do not add a public `isArkEnvError` helper or fake `instanceof` via `Symbol.hasInstance`. See [ADR 0024](./adr/0024-sibling-error-names.md).

## Important constraints

**Bundle Size:**

- Core package must be \~2 kB gzipped (enforced via `size-limit`)
- Vite plugin must be \~2 kB (enforced via `size-limit`)
- Zero external dependencies (except peer dependencies). Internal workspace packages are permitted.

**TypeScript Requirements:**

- TypeScript >= 5.1 required
- Modern module resolution required (`bundler`, `node16`, or `nodenext`)
- Strict type checking enabled

**Runtime Support:**

- Tested on Node.js LTS and Current (22 and 25)
- Tested on Bun 1.2+
- Browser support via Vite plugin

**Vite Plugin Compatibility:**

- Supports Vite 4.x through 8.x
- Validates environment variables at build-time
- Injects validated variables into build

**Monorepo Constraints:**

- All packages must use `workspace:*` protocol for internal dependencies
- Internal workspace dependencies (e.g., `@repo/*`) are permitted in both `dependencies` and `devDependencies` if bundled
- Only packages in `packages/` are published
- Examples and private apps are not published
- Changesets required for published packages only

## External dependencies

**Peer Dependencies:**

- **arktype** (^2.1.22) - Required peer of `@arkenv/core` (ArkType engine). Not required when using `@arkenv/standard`.
- **@arkenv/core** or **@arkenv/standard** - Optional peers of framework plugins (`@arkenv/nextjs`, `@arkenv/nuxt`, `@arkenv/vite-plugin`, `@arkenv/bun-plugin`); install exactly one engine.
- **vite** (^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0) - Required by `@arkenv/vite-plugin`

**External Services (www app only):**

- **Sentry** - Error tracking and monitoring
- **Vercel Analytics** - Analytics for documentation site
- **PostHog** - Product analytics

**Build Dependencies:**

- **@sentry/cli** - Sentry CLI for source maps (onlyBuiltDependencies)
- **@swc/core** - Fast TypeScript/JavaScript compiler (onlyBuiltDependencies)
- **esbuild** - Fast bundler (onlyBuiltDependencies)
- **sharp** - Image processing (onlyBuiltDependencies)

**Note:** The core `arkenv` package has zero external dependencies (except `arktype` as a peer dependency), keeping the bundle size minimal.
