# ADR 0030: `arkenv example` for schema → `.env.example`

The dedicated CLI command that merges `.env.example` from the loaded schema is `arkenv example`, with no `sync` or `generate` alias.

## Status

Accepted ([#1234](https://github.com/yamcodes/arkenv/issues/1234) closed by hand; shipped in [#1643](https://github.com/yamcodes/arkenv/pull/1643))

## Context

[#1234](https://github.com/yamcodes/arkenv/issues/1234) needs a post-`init` command that loads the project schema (same loader as `arkenv check`, [ADR 0027](./0027-cli-schema-inspection.md)) and writes or merges `.env.example` in the project root: keys from the schema, comments and values kept for surviving keys, stale keys dropped.

The first agent brief blessed `arkenv sync` after a two-way bikeshed (`sync` vs `generate`) so `generate` could stay free for TypeScript / Next.js `env.gen.ts`. That brief did not score:

1. Stealing `sync` from a later Doppler-style or provider pull.
2. Collision with `init --example` (registry template name, not the file).

In env-tooling, `sync` almost always means live secrets from a host. This job is local file reconciliation against the schema. Options and scoring live in [the hat evaluation](../design/cli-env-example-command-name.md).

## Decision

**Stack A3 + B1.**

1. **Public path is `arkenv example`.** One argv token after `arkenv`. Help one-liner: `Update .env.example from the schema`.
2. **No aliases.** Do not register `sync`, `generate`, `gen`, or `env-example` as alternate tokens. An alias still spends the verb in help and agent autocomplete.
3. **Disambiguate from `init --example`.** The command names the `.env.example` file. The `init` flag names a registry template. Docs and help must not blur them.
4. **Keep `sync` and `generate` free.** Reserve them for later hats (remote/provider pull or two-way sync; TypeScript / `.arkenv` codegen). Do not put them in `--help` for this job.
5. **JSON / agent envelopes use `commandId: "example"`**, not `"sync"`.

Optional later rename to `env-example` (A7) only if support noise from `example` vs `init --example` forces it. Do not ship both names.

## Considered options

- **A3 + B1 — `example`, no aliases (chosen).** Honest about the file. Leaves `sync` / `generate` free. Short token in the `init` / `check` / `preset` family.
- **A1 — `sync`.** Strong merge metaphor; wrong ecosystem (secret hosts) and zero headroom for a real sync command. Rejected after the hat.
- **A5 / A4 / A6 — `generate` / `gen` / `codegen`.** Imply TypeScript emit / `env.gen.ts`, not a dotenv template.
- **A7 — `env-example`.** A-tier tuck-away if `example` vs `--example` is too noisy. Not required to close #1234.
- **B2 — `sync` as hidden alias.** Still spends `sync` in autocomplete. Rejected.
- **A26 / A27 — fold into `init` or `check`.** Rejected in #1234: the example file drifts after day one; mixing validate-env with write-file confuses jobs.
- **A28 — `lint`.** Reserved for on-disk env-file lint (#481).

## Consequences

- Contributors and agents must use `arkenv example`, not `arkenv sync`, for local `.env.example` merge.
- A future remote sync or codegen command can take `sync` / `generate` without renaming this one.
- `init --example <name>` stays a template registry flag; do not document it as “run the example command.”
- The living hat remains the evaluation catalog; amend this ADR for renames or new aliases.
