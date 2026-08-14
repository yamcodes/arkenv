---
name: changeset
description: Write consumer-facing changesets for ArkEnv package releases. Use when adding changesets, preparing releases, choosing patch/minor/major, generating changelog entries, or documenting breaking changes.
metadata:
  author: Yam C Borodetsky
  original_author: Ollie Shop
  origin: github.com/ollieshop/creating-changesets
  version: 2.0.0
  internal: true
---

# Changesets

A changeset is the changelog entry npm users read. Write it for someone who installed `@arkenv/core` or `@arkenv/standard` and wants to know what changed in *their* `env.ts`.

Skip internal refactors, size-limit tweaks, and lockfile noise. If a user cannot act on it, do not ship it.

## Example

Create `.changeset/<short-name>.md`:

````markdown
---
"@arkenv/standard": minor
---

#### Add optional `toJsonSchema` for Valibot coercion

Pass `toJsonSchema` when a Standard Schema validator does not embed JSON Schema on the value. ArkEnv calls it per key when it cannot read JSON Schema from that value.

```ts
import arkenv from "@arkenv/standard";
import * as v from "valibot";
import { toJsonSchema } from "@valibot/to-json-schema";

export const env = arkenv(
  { PORT: v.number(), DEBUG: v.boolean() },
  {
    toJsonSchema: (schema: unknown) =>
      toJsonSchema(schema as v.GenericSchema, {
        typeMode: "input",
        target: "draft-07",
      }),
  },
);
```
````

That shape is the bar: named packages, SemVer bump, imperative `####` title, short consumer summary, then a copy-pasteable snippet.

More shapes: [scenarios](references/scenarios.md).

## Rules

- **Audience:** package consumers, not maintainers. Describe the new import, option, or behavior they get.
- **Always include a usage example** for features and user-facing fixes (TypeScript in a fenced `ts` block; `diff` for breaking changes).
- **Title:** `####` + imperative mood (`Add`, `Fix`, `Drop`). Not "Added" / "Adds".
- **No GitHub issue numbers.** The release PR already links the work.
- **Packages:** list only packages whose *public* API or behavior changed. `@arkenv/core` and `@arkenv/standard` are a `fixed` version group, so bumping one still versions the pair — do not add a sibling that did not change.
- **Ignore** `www` and playgrounds (see `.changeset/config.json`).

## Bump type (v1 SemVer)

This repo is in v1 prerelease (`1.0.0-alpha.x`). Use standard SemVer:

| Bump    | When                                                         |
| ------- | ------------------------------------------------------------ |
| `patch` | Bug fix, compatible improvement the user already relies on   |
| `minor` | New option, export, or capability. Existing `env.ts` still works |
| `major` | Existing user code must change                               |

For `major`, end with a short `**BREAKING CHANGE**:` note (1–2 lines) and a `diff` of before/after. Details: [scenarios](references/scenarios.md).

Do not add a changeset for docs-only or purely internal work.

## Workflow

```bash
pnpm changeset
```

Or write the markdown file by hand. Keep it on the feature PR.

After merge, Changesets opens a Version Packages PR; merging that publishes to npm. Pre-release tags (`alpha` → `beta` → `rc`): `docs/CONTRIBUTING.md`.

```bash
pnpm exec changeset status
ls .changeset/*.md
```

## Credits

Originally [Ollie Shop](https://github.com/ollieshop/creating-changesets).
