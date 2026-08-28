# CLI command name for schema → `.env.example`

Living evaluation, not an ADR. Update this file as options enter or leave the
hat. Promoted decisions belong in `docs/adr/`.

**Status:** working note for
[#1234](https://github.com/yamcodes/arkenv/issues/1234) /
[PR #1643](https://github.com/yamcodes/arkenv/pull/1643). **Chosen public
story:** `arkenv example` with no aliases (stack A3 + B1). The PR ships
that name; `sync` is not an alias.

## Problem

When we are done, a dedicated CLI command:

1. Loads the project schema (same loader as `check`) and writes or merges
   `.env.example` in the project root (keys from the schema; comments and
   values preserved for surviving keys).
2. Is a name people can put in CI and pre-commit without thinking it talks
   to a secret manager or a remote env store.
3. Does not spend a verb we will want for a *different* job later
   (cloud/provider pull, two-way env sync, TypeScript codegen).

The job is local file reconciliation against the schema. The original
[#1234](https://github.com/yamcodes/arkenv/issues/1234) brief blessed
`sync` after a two-way bikeshed (`sync` vs `generate`) so `generate` could
stay free for Next.js `env.gen.ts`. That brief did not score stealing
`sync` from a future command, or collision with `init --example`.

## Layer map

- **Layer A (public command path):** the argv token after `arkenv`. Items
  here are substitutes. One command, one job.
- **Layer B (alias policy):** extra tokens that invoke the same use case.
  Composes with A. Shipping an alias still occupies help text and agent
  autocomplete.

Do not flatten “what we call this” and “whether `sync` remains a hidden
alias” into one list. An alias of `sync` still spends the verb.

## Metrics

| Metric              | Question                                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| Honesty             | Does the name describe merging `.env.example` from the schema, not live secrets or TypeScript emit?         |
| Vocabulary headroom | Does this name leave `sync` and `generate` free for later, different jobs?                                  |
| CLI collision       | Does it clash with `init`, `check`, `preset`, `--example`, `--env-file`, or a future `lint`?                |
| Teachability        | Can help, docs, and agents discover it in one short token?                                                  |
| Merge implication   | Does it suggest preserve-and-diff rather than wipe-and-replace?                                             |
| Ecosystem footgun   | Would someone from Doppler / Vercel / Infisical / Prisma hear the wrong product?                            |
| Rename tax          | Cost of changing `commandId`, docs, help, and #1643 before merge vs after shipping `sync` on the alpha tag. |

## The hat

### Layer A — public command path

| #   | Option                                      | Notes                                                        |
| --- | ------------------------------------------- | ------------------------------------------------------------ |
| A1  | `sync`                                      | Blessed in the #1234 agent brief. Current PR.                |
| A2  | `template`                                  | User-suggested. Scaffolding already has example *templates*. |
| A3  | `example`                                   | User-suggested. Artifact is `.env.example`.                  |
| A4  | `gen`                                       | User-suggested abbreviation of generate.                     |
| A5  | `generate`                                  | Original bikeshed rival. Prisma-shaped.                      |
| A6  | `codegen`                                   | User-suggested. Implies TypeScript / `env.gen.ts`.           |
| A7  | `env-example`                               | User-suggested. Filename as command.                         |
| A8  | `update`                                    | User-suggested. Vague object.                                |
| A9  | `refresh`                                   | Verb like `check`. Does not name the file.                   |
| A10 | `dump`                                      | Overwrite energy. Hostile.                                   |
| A11 | `export`                                    | Sounds like dumping `process.env` or a shell export.         |
| A12 | `write-example`                             | Honest, long, hyphen pile.                                   |
| A13 | `pull`                                      | Cloud-secret verb. Out of scope for this job.                |
| A14 | `push`                                      | Same family as pull. Wrong direction.                        |
| A15 | `hydrate`                                   | Jargon; sounds like filling values.                          |
| A16 | `seed`                                      | Sounds like writing `.env` with starter secrets.             |
| A17 | `emit`                                      | Compiler-speak.                                              |
| A18 | `snapshot`                                  | Implies a point-in-time copy of live env.                    |
| A19 | `align` / `reconcile`                       | Accurate, uncommon as CLI verbs.                             |
| A20 | `example-env`                               | Word order vs the filename.                                  |
| A21 | `dotenv-example`                            | Brands a format ArkEnv is not a loader for.                  |
| A22 | `schema-example`                            | Honest source, still hyphenated.                             |
| A23 | `make-example`                              | Make-ism.                                                    |
| A24 | `sync-example`                              | Keeps `sync` in the public path.                             |
| A25 | `example sync` (subcommand)                 | Extra noun for one job.                                      |
| A26 | Fold into `init` only                       | Rejected in #1234: `.env.example` drifts after day one.      |
| A27 | Fold into `check` (`check --write-example`) | Mixes validate-env with write-file.                          |
| A28 | `lint`                                      | Reserved for on-disk env-file lint (#481).                   |

### Layer B — alias policy

| #  | Option                                   | Notes                                 |
| -- | ---------------------------------------- | ------------------------------------- |
| B1 | No alias                                 | One name in help.                     |
| B2 | Keep `sync` as alias of the S name       | Spends `sync` in autocomplete anyway. |
| B3 | Keep `generate` as alias                 | Spends the codegen verb.              |
| B4 | Hide the old name, document only the new | Still a second parser token.          |

## Evaluation

**A1 `sync`** — Strong merge implication (reconcile two sources, do not
wipe). Weak honesty for *which* two sources: in env-tooling, `sync` almost
always means live secrets from a host. Zero vocabulary headroom for a later
Doppler-like or provider pull; that is the worry that reopened the hat.
Collides with nothing on today's CLI. Teachability is fine until the first
wrong mental model. Rename tax is lowest if we keep the PR as-is, highest
if we ship it on the alpha tag and rename later.

**A2 `template`** — Honest that the output is a sanitized template, not
secrets. Collides with `init --example` *templates* (registry examples) and
with “hosting preset templates.” Weak merge implication (could be
write-once scaffold). Leaves `sync` and `generate` free. Medium
teachability: users must learn that the template *is* `.env.example`.

**A3 `example`** — Names the artifact people already say (`.env.example`).
Does not sound like a secret pull. Leaves `sync` and `generate` free. CLI
collision with `init --example` (registry example name) is real: same
English word, different objects, different commands. Help can split them
(`init --example` vs `example`). Merge implication is weak on the verb
alone; docs carry “merge-aware.” Short like `init` / `check` / `preset`.

**A4 `gen`** — Looks like `prisma generate` chopped. Spends the codegen
syllable. Does not name `.env.example`. Easy to type, easy to misread as
`env.gen.ts`.

**A5 `generate`** — The #1234 brief deferred this so Next codegen could
own it. That job still exists (`env.gen.ts` / `.arkenv/`). Using it here
forces a later codegen command into `codegen`, `gen-types`, or a plugin
script. Prisma footgun: people will expect generated TS. Merge implication
is “emit a file,” which can mean overwrite.

**A6 `codegen`** — Same as generate, worse: this command does not generate
code. Dishonest. Leave for TypeScript artifacts.

**A7 `env-example`** — Most specific. Matches `--env-file` hyphen style.
No collision with `--example`. Slightly awkward to say; longer than other
commands. Honesty and headroom both high. Merge implication still needs a
docs sentence.

**A8 `update`** — Does not say what is updated. Could be schema, deps, or
`.env`. Poor teachability.

**A9 `refresh`** — Decent verb, no cloud connotation, no file name. Agents
searching for `.env.example` will not grep `refresh`.

**A10 `dump`** — Sounds like overwrite and like printing secrets. Fail
honesty and merge implication.

**A11 `export`** — Shell / `process.env` export. Wrong artifact.

**A12 `write-example`** — Honest, clumsy, implies create more than merge.

**A13 `pull` / A14 `push`** — Spend the remote-sync verbs *and* teach the
wrong model. Score them so they cannot sneak back as “more accurate sync.”

**A15 `hydrate` / A16 `seed` / A18 `snapshot`** — Sound like filling real
values into `.env`. Opposite of a sanitized example file.

**A17 `emit`** — Compiler jargon; same family as generate.

**A19 `align` / `reconcile`** — Accurate merge story, unusual argv.
Teachability low.

**A20 `example-env`** — Fights the filename (`.env.example` not
`.example.env`).

**A21 `dotenv-example`** — ArkEnv is not a dotenv loader (`check` only
reads `--env-file` when asked). Bad glossary.

**A22 `schema-example`** — Honest about the source, silent about the
output path.

**A23 `make-example`** — Make-ism; still “example.”

**A24 `sync-example`** — Keeps `sync` in the public command. Fails
headroom almost as hard as A1.

**A25 `example sync`** — Two tokens for one job; `preset apply` earns the
extra word because apply/remove are two actions.

**A26 init-only / A27 check flag / A28 lint** — Wrong lifecycle or wrong
existing command. Stay rejected.

**B1 no alias** — Help lists one path. `sync` stays unused until a later
hat for a different job.

**B2 alias `sync`** — Softens rename tax for anyone who saw #1643, and
immediately puts `sync` back in `--help` and agent tools. Fails the
problem statement.

**B3 alias `generate`** — Same class of spend as A5.

**B4 hidden old name** — Agents and `--help` still need a story; hidden
tokens become folklore.

### Close call: `example` vs `env-example` vs `template`

| Metric            | `example`                           | `env-example`         | `template`                        |
| ----------------- | ----------------------------------- | --------------------- | --------------------------------- |
| Honesty           | Names the file family               | Names the file        | Names “not secrets,” not the path |
| Headroom          | Frees `sync` and `generate`         | Same                  | Same                              |
| Collision         | `init --example`                    | Low                   | Init/preset “templates”           |
| Teachability      | Short; docs must say `.env.example` | Long; self-describing | Medium                            |
| Merge implication | Neutral                             | Neutral               | Slightly write-once               |

`example` wins teachability and CLI shape. `env-example` wins collision
and self-description. `template` loses both collisions and path honesty.

## Tier list

Solutions ranked as **answers to the whole problem** (name this job *and*
leave later verbs free). Stack is Layer A + Layer B.

**S (chosen / default story)**

- **A3 + B1 — `arkenv example`, no aliases.** Short command in the
  `init` / `check` / `preset` family. Output is the file everyone already
  calls the example file. `sync` stays unused for a future remote or
  two-way job. `generate` / `gen` / `codegen` stay unused for TypeScript
  artifacts. Docs and help must say `.env.example` in the one-line
  description so `--example` on `init` and this command do not look like
  the same flag.

**A**

- **A7 + B1 — `arkenv env-example`, no aliases.** Optional if `example`
  vs `init --example` proves too noisy in support. Do not ship a second
  token now. Do not alias `example` *and* `env-example`.

**B**

- **A9 `refresh`** — Fine verb, anonymous object.
- **A2 `template`** — Sanitized-file story, wrong neighbor words.
- **A22 `schema-example`** — Source-honest, output-shy.
- **A12 `write-example`** — Honest length tax.

**C**

- **A1 `sync`** — Right merge metaphor, wrong ecosystem and headroom.
  Acceptable only if we explicitly decide there will never be another
  `sync`. That is the opposite of this hat.
- **A5 `generate` / A4 `gen` / A6 `codegen`** — Spend the codegen verb;
  dishonest for a dotenv-shaped file.
- **A8 `update`** — Too vague.
- **A24 `sync-example`** — Still a `sync` command.

**D**

- **A19 `align` / `reconcile`** — Accurate, un-CLI.
- **A20 `example-env` / A21 `dotenv-example` / A23 `make-example`**
- **A25 subcommand `example sync`**
- **B2 / B3 / B4 aliases** — Re-spend reserved verbs.

**E**

- **A10 `dump` / A11 `export` / A13 `pull` / A14 `push` / A15 `hydrate` /
  A16 `seed` / A17 `emit` / A18 `snapshot`**
- **A26 init-only / A27 `check --write-example` / A28 `lint`**

## S and A usage

### Use case 1: first `.env.example` from a schema

**S:**

```txt
arkenv example
✔ Created .env.example from env.ts
```

**A:**

```txt
arkenv env-example
✔ Created .env.example from env.ts
```

### Use case 2: schema gained a key, CI must not drift

**S:**

```txt
arkenv example
✔ Updated .env.example from env.ts
```

```yaml
- run: pnpm exec arkenv example
```

**A:**

```txt
pnpm exec arkenv env-example
```

### Use case 3: later, a *different* job pulls provider env

**S:** `example` does not occupy `sync`, so a future hat can still choose
`arkenv sync` (or reject it again) for Doppler-style pull without
renaming this command.

```txt
arkenv example          # still the local .env.example merge
arkenv sync             # not this job; reserved / undecided
```

**A:** same, with `env-example` as the local command.

### Use case 4: later TypeScript codegen

**S:**

```txt
arkenv example          # .env.example only
arkenv generate         # still free for env.gen.ts / .arkenv if we want it
```

**A:** same split.

### Use case 5: JSON / agent envelope

**S:** `commandId` is `"example"`, not `"sync"`.

```json
{ "ok": true, "commandId": "example", "result": { "status": "unchanged" } }
```

**A:** `"env-example"`.

## Current lean

Ship **`arkenv example`** with **no `sync` alias**. Rewrite #1643 (help,
docs, `commandId`, tests, changeset, glossary) before merge if this lean
stands. Do not add `env-example` as a second name in that PR.

Help one-liners (disambiguate flag vs command):

```txt
arkenv example                 Update .env.example from the schema
--example                      Specify an example name when creating a new project
```

The command names the file; the `init` flag names a registry template.
Do not use `generate` or `sync` in the command blurb.

Keep `sync` and `generate` out of `--help` until a later hat for those
jobs.

The #1234 brief's preference for `sync` over `generate` is recorded as
A1 vs A5, not as the S stack.

## Changelog of this note

- 2026-08-28: First write-up (layers, metrics, hat, tier list) after
  concern that `sync` blocks a later sync-shaped command.
- 2026-08-28: Help one-liner locked to `Update .env.example from the
  schema` vs init `--example` as a registry template name.
