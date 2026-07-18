# Strict layout is a security boundary with a complexity budget

To decide how much DX investment ArkEnv puts into the strict (split-file) layout versus the flat/simple layout — and which classes of strict-mode features are in or out of scope.

## Context & problem

Flat/simple layout is the default and the best DX: one schema file, API aligned with core `arkenv`, and (on Next.js) codegen that removes `runtimeEnv` boilerplate so the experience can match non-Next hosts.

Strict layout exists for a narrower reason, shared with `@t3-oss/env-*`: when client and server schemas live in one module, server variable *names*, *types*, and validation logic can ship in the client bundle. Teams that consider that sensitive split into separate files so the server schema never enters the client import graph (see ADR 0010, ADR 0012, ADR 0013).

Two forces pull in opposite directions:

1. **Strict users opted into a boundary, not into boilerplate.** Security-conscious ≠ wants hand-written `runtimeEnv` or manual `extends: [clientEnv]`. Most strict choosers want the isolation *and* not-worse-than-necessary DX. A small slice wants full control; escape hatches (`codegen: false`, explicit `extends`) already serve them.
2. **Strict is a minority path.** Every strict-only affordance (extra generated files, dual scaffolds, docs forks, parallel virtual-module stacks) is ongoing cost across CLI, docs, tests, and agents. The scarce resource is complexity budget, not a ban on helping strict users.

Related work crystallised the tension:

- [#1304](https://github.com/yamcodes/arkenv/issues/1304) proposed an in-tree `server.gen.ts` factory for Next strict layout.
- [#1307](https://github.com/yamcodes/arkenv/issues/1307) / [#1401](https://github.com/yamcodes/arkenv/pull/1401) give Nuxt the same server DX via a thin virtual alias (`#arkenv/client-env`) and auto-extend on `@arkenv/nuxt/server` — no new files under `env/`.
- [#1402](https://github.com/yamcodes/arkenv/issues/1402) explored moving Next codegen to tool-owned virtual modules so `env/` stays user-authored only.

We also compared to t3-env: split mode uses the same `createEnv` in `client.ts` / `server.ts`; `extends` exists for presets and composition; server can often use `experimental__runtimeEnv: process.env`. ArkEnv’s differentiators (no top-level `server:` / `client:` bags, `internal/shared`, Next `runtimeEnv` codegen, scaffolded server←client merge) are real, but they do not justify a second full DX product under strict.

## Decision

1. **Keep strict layout.** Its product promise is compile-time schema isolation. Flat/simple remains the default and the “feels like core `arkenv`” path.
2. **Strict is not “flat DX in a trench coat.”** We do not aim to make every flat affordance available under strict at equal cost.
3. **Still improve strict DX** when the win is cheap and removes pain *caused by* the boundary:
   - **In:** Next client `runtimeEnv` help (host-specific tax); Nuxt-style server auto-extend via a thin host alias / define flag; keeping `env/internal/shared.ts` as a privacy guardrail (not a public `@/env/shared` import).
   - **Out (as centerpiece):** a generated server factory (`server.gen.ts` / `arkenv/gen/server`) whose only job is baking `extends: [clientEnv]`, unless a Next-specific constraint later proves package-entry auto-extend impossible.
4. **Governor = cost, not disdain for magic.** Prefer reusing host plugin/module machinery. Reject features that fork docs, CLI, and scaffolds into a parallel strict universe.
5. **Escape hatches remain** for the fully custom slice; they are not the default story for all strict users.
6. **User-facing `env/` stays small:** `client.ts`, `server.ts`, `internal/shared.ts`. Machine-owned artifacts should not accumulate as siblings of editable schemas when a cheaper host-owned approach exists (see #1402 for residual Next client-factory placement questions).

## Consequences

- **[#1304](https://github.com/yamcodes/arkenv/issues/1304) is superseded** as an end-state design (in-tree server factory). Server DX should follow the #1307 pattern on Next if feasible.
- **[#1307](https://github.com/yamcodes/arkenv/issues/1307) / [#1401](https://github.com/yamcodes/arkenv/pull/1401) fit this ADR** and should ship as additive work on `dev` when non-breaking.
- **[#1402](https://github.com/yamcodes/arkenv/issues/1402) narrows:** pursue client-factory virtualization / keeping `env/` clean if warranted; do not center the RFC on a generated server factory.
- **Docs and scaffolds** should describe strict as a security layout with targeted ergonomics, not as a second primary onboarding path equal to flat.
- **Future strict features** must answer: does this remove boundary-induced pain at low surface-area cost? If not, decline or defer.
