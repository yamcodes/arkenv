# Flat layout codegen and type inference strategy

To define how the `@arkenv/nextjs` flat layout generates its `env.gen.ts` factory and how that factory types the returned `env`, balancing single-file developer experience, correct Server Component types, and client-side security.

## Context & problem

The flat layout lets developers declare every environment variable in a single `env.ts` by calling a generated `arkenv(schema, options)` factory. The schema is owned by the user's `env.ts`; the only file ArkEnv generates is `env.gen.ts`, which exports the factory.

Three forces collide:

1. **Server Components need server-only keys typed.** A Server Component reading `env.DATABASE_URL` must type-check.
2. **Client bundles must not leak server secrets.** Reading a server-only key on the client must fail.
3. **`@arkenv/nextjs` ships `react-server` vs `default` export conditions.** In a true RSC, `@arkenv/nextjs` resolves to the full-typed `react-server` build; otherwise to the client-filtered `index` build.

The breaking constraint: TypeScript does **not** apply the `react-server` export condition to a transitively-imported, user-land generated file during `next build`'s `tsc` pass. So the generated factory's import of `@arkenv/nextjs` always resolved to the client-filtered `index.d.ts`, leaving Server Components unable to see server-only keys. Forcing users to add `customConditions: ["react-server"]` to their `tsconfig.json` is a DX anti-pattern (and would also flip client components to the full type).

Two implementation paths were considered:

- **Path A - Generic wrapper (chosen).** Generate a generic `createEnv` factory whose return type is inferred from the caller's schema via `distill.Out<at.infer<TSchema>>`, annotated explicitly so it exposes the full schema. The runtime `Proxy` from `@arkenv/nextjs` enforces the security boundary by throwing when a server-only variable is read on the client. This mirrors the "trust the proxy" approach used by `@t3-oss/env-nextjs`.
- **Path B - Static compiled object.** Have the CLI statically evaluate the ArkType schema at build time and emit a hardcoded `export const env: { DATABASE_URL: string; ... }` with zero generic overhead and perfectly human-readable types.

Path B is attractive but, for the flat layout, conflicts with its own design: the concrete `env` lives in the user's `env.ts`, not in `env.gen.ts`. Delivering Path B would require the CLI to take ownership of the `env` declaration and act as a mini ArkType compiler - statically parsing arbitrary ArkType syntax (morphs, narrows, unions, defaults, `.to()`, etc.) into TypeScript literal types. That re-couples codegen to schema contents (regenerating on every edit), is high-maintenance, and silently drifts from ArkType as its grammar evolves.

## Decision

We adopt **Path A** for the flat layout.

1. **Explicit full-type annotation.** `generateFlatFactoryCode` emits the factory with an explicit return type of `Readonly<distill.Out<at.infer<TSchema>>>`, exposing the full schema regardless of how `@arkenv/nextjs` resolves. This bypasses the `react-server` TypeScript wall with zero user `tsconfig` changes.
2. **Runtime Proxy is the security boundary.** Types protect the happy path; the existing `Proxy` in `@arkenv/nextjs` throws on client access to server-only keys. Compile-time client filtering is intentionally not provided in the flat layout.
3. **Accepted limitations of the wrapper.** The generated code uses bare `at.infer<TSchema>` (not `at.infer<TSchema, $>`) and omits `MergeExtends`, because the arkenv scope (`$` from `@repo/scope`) and `MergeExtends` (`./types`) are internal and not part of the public `@arkenv/nextjs` surface, so they cannot be referenced from user-land generated code. Flat-layout usage does not rely on custom scope keywords or `extends`.
4. **No new inference overhead.** `distill.Out<at.infer<...>>` is the same pattern used by every existing entry point (`index`, `server`, `client`, `shared`, `react-server`), so Path A matches the package baseline rather than introducing a new hotspot.
5. **Strict layout is unaffected.** Projects needing compile-time client/server separation use the strict layout (`env/server.ts`, `env/client.ts`), which keeps its dedicated entry points.

## Consequences

- **Zero-config DX.** Server Components type server-only keys; client components type all keys (runtime Proxy guards misuse). Users never touch `tsconfig.json`.
- **Simple, robust CLI.** Codegen stays a boilerplate emitter decoupled from schema contents; it never tracks ArkType grammar.
- **Security is runtime-enforced in flat mode.** A developer can write `env.DATABASE_URL` in a client component and TypeScript will allow it; the Proxy throws at runtime. Teams wanting compile-time prevention should use the strict layout.
- **Future "compiled mode" remains open.** Path B (CLI statically compiling ArkType into static types) is a deliberate future enhancement behind a separate layout/flag - not a retrofit onto the flat factory.
- **Maintenance tripwire.** A concise `@remarks` note on `generateFlatFactoryCode` references this ADR so contributors and AI agents editing `config.ts` do not attempt to statically compile the schema or add internal-only types to generated code.
