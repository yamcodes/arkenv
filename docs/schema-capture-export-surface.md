# Schema capture export surface

Living evaluation that was **promoted** (export-surface S) into [ADR 0027](./adr/0027-cli-schema-inspection.md). Slot new packaging ideas here; the ADR is the decision.

**Status:** promoted for [#1314](https://github.com/yamcodes/arkenv/issues/1314) / PR [#1622](https://github.com/yamcodes/arkenv/pull/1622). **Chosen public story:** unpublished start/stop; CLI keeps `@repo/utils`.

Related consumer notes: version skew on [#962](https://github.com/yamcodes/arkenv/issues/962) / [#1234](https://github.com/yamcodes/arkenv/issues/1234).

## Problem

When we are done:

1. App `env.ts` stays `export const env = arkenv({ ... })`. Authors never wrap that call in capture helpers.
2. The ArkEnv CLI can import a flat schema module and read declared keys **without** validating `process.env`.
3. Autocomplete, the changelog, and the main `@arkenv/core` / `@arkenv/standard` barrels do not present capture as application API.
4. The handshake still works when the CLI and the user’s `arkenv()` are different module instances (Jiti + `node_modules`).

Out of scope for this note: `sync` / `check` command UX. Mechanism (record vs stub vs boot) is [schema-loader-mechanism.md](./schema-loader-mechanism.md). Version-skew detection vs upgrade hint is on the consumer issues.

The engine that all options assume: `arkenv()` in core and standard already short-circuits on `isCapturingSchema()` and `recordSchemaCapture()`, sharing state via `globalThis.__ARKENV_SCHEMA_CAPTURE__`. That implementation is not a rival of the export-surface options.

## Layer map

- **Layer A — Published start/stop contract:** how (if at all) a *tool* is allowed to enter capture. Substitutes for each other.
- **Layer B — Package that owns that contract:** where a published (or internal) start/stop import lives. Substitutes. Only bites if Layer A is not “no public API.”
- **Layer C — Entry path:** main barrel vs a subpath on that package. Substitutes. Only bites if Layer B is a published package.
- **Layer D — Symbol set:** which names we commit to. Substitutes. Only bites if Layer A exports functions.

Items on different layers compose. “Put it on `@arkenv/core`” is not a complete answer; it is B + C until A and D are chosen.

## Metrics

| Metric                | Question                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Honesty               | Does the import path match the audience (app vs tool)?                                                                                      |
| App footguns          | Can changelog / autocomplete trick people into calling this from `env.ts`?                                                                  |
| CLI sufficiency       | Can *our* CLI capture without this surface?                                                                                                 |
| Third-party tools     | Can a published plugin or other CLI start capture without a private protocol?                                                               |
| Dual-engine tax       | Do we duplicate API on `@arkenv/core` *and* `@arkenv/standard` for one protocol?                                                            |
| Handshake / skew      | Does the story pretend `begin()` must come from the same package instance as the user’s `arkenv()`? (It must not. The bus is `globalThis`.) |
| Bundle                | Does `size-limit` `import: "*"` on the main entry pay for tooling the app never calls?                                                      |
| Teachability          | Can we explain it in one sentence?                                                                                                          |
| Semver / hide-ability | Are we committing a public API we will regret, or hiding something tools will scrape anyway?                                                |
| Maintenance hell      | New package, dual barrels, documenting a magic global, or fighting our own changelog examples?                                              |

## The hat

### Layer A — Published start/stop contract

| #  | Option                                                                  | Notes                                                                                                                    |
| -- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| A1 | No public start/stop                                                    | Only our CLI (and in-repo tests) call `begin`/`end`. Protocol stays unpublished.                                         |
| A2 | Document `globalThis.__ARKENV_SCHEMA_CAPTURE__` as the protocol         | Tools poke the bag; no function export.                                                                                  |
| A3 | Export `beginSchemaCapture` / `endSchemaCapture` as supported functions | What PR #1622 put on the barrels.                                                                                        |
| A4 | App authors wrap `arkenv()` in `env.ts`                                 | The changelog-shaped misunderstanding. **Rejected as product.** Stays in the hat so it cannot return as “ergonomic API.” |

### Layer B — Package that owns the contract

| #  | Option                     | Notes                                                                                                         |
| -- | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| B1 | `@repo/utils` only         | Unpublished. CLI and `arkenv()` already use this.                                                             |
| B2 | `@arkenv/core` only        | Standard-tier `env.ts` still runs `arkenv()` from `@arkenv/standard`; start/stop does not have to live there. |
| B3 | `@arkenv/standard` only    | Symmetric miss for ArkType-only apps.                                                                         |
| B4 | Both core and standard     | Status quo on #1622. Duplicates one protocol.                                                                 |
| B5 | `arkenv` (the CLI package) | Tools that must not depend on the CLI.                                                                        |
| B6 | New `@arkenv/capture`      | Four functions that already live in utils.                                                                    |
| B7 | `@arkenv/build`            | Published plugin-build utils. Capture is not codegen.                                                         |

### Layer C — Entry path

| #  | Option                 | Notes                                               |
| -- | ---------------------- | --------------------------------------------------- |
| C1 | Main barrel `.`        | Status quo. Same import as `arkenv`.                |
| C2 | `/tooling` (or `/cli`) | Published, not the default import.                  |
| C3 | `/internal`            | “Unstable” not “for tools.” People still import it. |
| C4 | No extra path          | N/A when A1/B1.                                     |

### Layer D — Symbol set

| #  | Option                                         | Notes                                                          |
| -- | ---------------------------------------------- | -------------------------------------------------------------- |
| D1 | `beginSchemaCapture` + `endSchemaCapture` only | Enough to drive the bag.                                       |
| D2 | D1 + `isCapturingSchema`                       | Status quo export. App-adjacent curiosity.                     |
| D3 | D2 + `recordSchemaCapture`                     | Lets tools fake `arkenv()`; bypasses the real short-circuit.   |
| D4 | Export the global key as a named constant      | Makes A2 slightly less magic without documenting a raw string. |

## Evaluation

**A1 No public start/stop** — Honesty and app footguns are best: the thing apps import does not mention capture. CLI sufficiency is already true (`JitiSchemaLoaderAdapter` imports `@repo/utils`). Third-party tools lose a blessed import until we add A-tier later; they could still set `globalThis` (unsupported). Handshake/skew is honest: we are not implying you import `begin` from the same module as `arkenv`. Bundle wins if we drop the re-exports from the main entry. Teachability: “the CLI inspects `env.ts`; you don’t call anything.” Semver: we can add a subpath later without taking names off `arkenv()`. Maintenance: tests import from `@repo/utils` or exercise capture only through `arkenv()` + a test-only begin.

**A2 Document the global bag** — Honest that the bus is process-global. Terrible teachability and a freeze on the key name. Footguns shift from “call these in `env.ts`” to “mutate `globalThis` in `env.ts`.” Third-party tools work without a package export. Handshake/skew is accurate. Maintenance hell: we owe a protocol spec and cannot rename the key casually.

**A3 Export begin/end as supported functions** — Right *kind* of API for tools, wrong unless Layer C keeps it off the app barrel. CLI does not need it. Dual-engine tax depends on B. Handshake: easy to document wrongly (“import begin from the same `@arkenv/core` as the app”) even though any copy that writes the bag works. Semver: names on the barrel are sticky.

**A4 Wrap `arkenv()` in `env.ts`** — Fails honesty, footguns, and the actual product. Capture exists *so* authors do not do this. Zero CLI value. Rejected.

**B1 `@repo/utils` only** — Matches how the CLI already works. CLI sufficiency: S. Third-party: fail (package is private). Dual-engine tax: none. Bundle: none on published entries. Maintenance: status quo internals.

**B2 `@arkenv/core` only** — One published home. Standard-tier tools still call `begin` from core; that is fine (global bag). Dual-engine tax: low. Honesty: core is the ArkType engine, not “tooling,” unless C2. Apps on core still see it if C1.

**B3 `@arkenv/standard` only** — Same as B2 with the audience flipped. Worse for the default ArkType story.

**B4 Both barrels** — Status quo. Dual-engine tax is real for no handshake benefit. Doubles changelog and autocomplete pollution if C1.

**B5 CLI package** — Honesty for “this is the CLI.” Third-party plugins should not depend on `arkenv` the CLI. Bundle of the CLI already has the loader. Footguns: `init` users might import from the CLI in `env.ts` (weird, but possible).

**B6 `@arkenv/capture`** — Honest package name. Maintenance hell and catalog noise for four functions. Handshake still `globalThis`. Size-limit on core/standard stays clean. Teachability: “install another package to inspect env” is a lot.

**B7 `@arkenv/build`** — Wrong job. That package is watch/codegen for plugins. Capture would drag a new concern into a dependency plugins already take. Weak honesty.

**C1 Main barrel** — Worst honesty and footguns. The #1622 changeset example was C1 + A3: it *looked* like app code. `size-limit` `import: "*"` includes it. Autocomplete on `import { … } from "@arkenv/core"` lists `beginSchemaCapture` next to `arkenv`.

**C2 `/tooling` (or `/cli`)** — Honesty: path is the audience. Footguns drop a lot (you must type the subpath). Dual-engine: still B’s problem. Teachability: “tools import `@arkenv/core/tooling`.” Semver: we can add this later without having put names on `.`. Bundle: main entry can stop re-exporting. Matches the spirit of `@arkenv/standard/valibot` (subpath = not the default story).

**C3 `/internal`** — Signals “don’t use this” while still publishing it. Tools will use it anyway; apps might too. Weaker than C2 for teachability.

**C4 No extra path** — Correct when A1/B1. Incomplete if A3 and B2/B4.

**D1 begin + end only** — Minimum tool surface. `isCapturingSchema` stays an `arkenv()` implementation detail.

**D2 + isCapturingSchema** — Status quo. Useful in tests; invites apps to branch on capture. No extra handshake power.

**D3 + recordSchemaCapture** — Lets a tool record without going through `arkenv()`. Undermines “we captured what `arkenv()` saw.” Skip.

**D4 named global key** — Helps A2 or documents the bus next to D1. Do not make the string the *primary* story.

## Tier list

Solutions ranked as **answers to the whole problem**. Complete answers are **stacks**.

**S (chosen / default story)**

- **A1 + B1 + C4 + (no public D)** — Do not publish start/stop. CLI and tests use `@repo/utils`. `arkenv()` keeps the internal short-circuit. Changelog talks about the CLI inspecting `env.ts`, not about calling `beginSchemaCapture`. This already satisfies #1314’s loader. It does not require a new subpath to merge.

**A**

- **A3 + B2 + C2 + D1** — Later, if a tool *outside* this repo needs a supported import: `begin`/`end` on **`@arkenv/core/tooling` only** (one protocol home; standard-tier `arkenv()` still honors the bag). Do not ship this to close #1622.
- Optional twin: re-export the same two functions from `@arkenv/standard/tooling` for discoverability (B4 + C2 + D1). Distribution, not a blocker.

**B**

- **A3 + B4 + C2 + D1** — Publish on both engines’ `/tooling` from day one. Fine if we want symmetry; extra files for no handshake gain.
- **A1 now, A3+C2 when `sync`/`check` ship** — Same S, with a calendar. The consumer issues can grow a “public tooling entry” bullet then.

**C**

- **A3 + B4 + C1 + D2** — Current PR. Works. Teaches the wrong import. Changelog already had to walk it back. Bundle and autocomplete tax.
- **A2** — Accurate protocol, ugly product. Keep as escape hatch in a comment, not a docs page.

**D**

- **A4** — App-level wrap. Rejected.
- **B5, B6, B7** as the *home* of the contract — wrong package job or extra package.
- **C3 `/internal`** — published-but-ashamed.
- **D3** — export `recordSchemaCapture`.

**E**

- Alias the user’s `@arkenv/core` to the CLI’s copy so `begin` and `arkenv` share a module instance. Fixes the wrong problem (skew is “old `arkenv()` ignores the bag,” not “begin is in the wrong package”). Recorded as a non-fix on #962 / #1234.

## S and A usage

### Use case 1: App `env.ts`

**S:**

```ts
import { arkenv } from "@arkenv/core";

export const env = arkenv({
  DATABASE_URL: "string",
  PORT: "number = 3000",
});
```

Same for `@arkenv/standard`. Capture names are not in the import.

**A:**

```ts
// still the same — /tooling is not for this file
import { arkenv } from "@arkenv/core";

export const env = arkenv({
  DATABASE_URL: "string",
  PORT: "number = 3000",
});
```

### Use case 2: ArkEnv CLI schema loader

**S:**

```ts
import { beginSchemaCapture, endSchemaCapture } from "@repo/utils";

beginSchemaCapture();
jiti(schemaPath);
const definitions = endSchemaCapture();
```

Production composition still constructs the adapter **without** Jiti aliases; the user’s `arkenv()` must contain the short-circuit (version skew — upgrade hint, not this hat).

**A:**

CLI may keep `@repo/utils` even after `/tooling` exists. Switching the CLI to `@arkenv/core/tooling` is optional and does not change the bag.

### Use case 3: In-repo unit test of the short-circuit

**S:**

```ts
import { beginSchemaCapture, endSchemaCapture } from "@repo/utils";
import { arkenv } from "@arkenv/core";

beginSchemaCapture();
expect(arkenv({ DATABASE_URL: "string" })).toEqual({});
expect(endSchemaCapture()).toEqual([{ DATABASE_URL: "string" }]);
```

Do not assert that `beginSchemaCapture` is a **public** export of `@arkenv/core`.

**A:** Tests for the subpath itself:

```ts
import { beginSchemaCapture, endSchemaCapture } from "@arkenv/core/tooling";
```

### Use case 4: Third-party tool (not this repo)

**S:** Unsupported. Wait, or poke `globalThis` at your own risk. Not documented.

**A:**

```ts
import { beginSchemaCapture, endSchemaCapture } from "@arkenv/core/tooling";

beginSchemaCapture();
await import(userEnvPath);
const definitions = endSchemaCapture();
```

The user’s project still supplies `@arkenv/core` / `@arkenv/standard` that honor the bag. Importing `/tooling` from a *newer* core than the app’s `arkenv()` does not skip validation — same skew as the CLI.

## Current lean

- **Shipped on #1622:** S — `beginSchemaCapture`, `endSchemaCapture`, and `isCapturingSchema` are not on the `@arkenv/core` / `@arkenv/standard` barrels. `arkenv()` still short-circuits. CLI stays on `@repo/utils`. Changeset describes CLI inspect, not a public capture import.
- **Do not ship to close this PR:** `/tooling` subpaths, `@arkenv/capture`, documenting the global key, exporting `recordSchemaCapture`.
- **A-tier when a tool outside the repo needs it:** `@arkenv/core/tooling` with D1 only.

## Changelog of this note

- 2026-08-27: First write-up (layers, metrics, hat, tier list) after the #1622 changeset was misread as app API.
- 2026-08-27: Implemented S on the PR (barrel unexport; tests import start/stop from `@repo/utils`).
- 2026-08-27: Promoted export-surface S into [ADR 0027](./adr/0027-cli-schema-inspection.md).
