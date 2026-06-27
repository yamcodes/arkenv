# Next.js conditional package exports as the server/client boundary

To decide how `@arkenv/nextjs` selects which build of the library is loaded in server versus client contexts, replacing fragile runtime environment detection with a bundler-level guarantee.

## Context & problem

`@arkenv/nextjs` needs different behavior in two contexts:

1. **Server Components & Route Handlers** must be able to read server-only secrets such as `DATABASE_URL`.
2. **Client Components (SSR and browser)** must only access public variables (client and shared keys).

A naive approach is to branch at runtime with `typeof window` checks. This is fragile because Next.js renders Client Components on the server during SSR, where `typeof window` is still `"undefined"` even though the code is being prepared for the browser. Relying on runtime detection would let server secrets slip into client bundles or, conversely, block legitimate server access.

We evaluated two mechanisms for enforcing the boundary:

- **Option 1: Runtime environment detection (rejected).** Use `typeof window` or `typeof process` checks inside the library to decide which variables to expose. Simple to implement but unreliable during SSR and gives users no compile-time confidence.
- **Option 2: Next.js conditional package exports (chosen).** Publish `@arkenv/nextjs` with multiple export conditions (`react-server` for Server Components / Route Handlers, `default` for Client Components), and let the Next.js bundler resolve the correct build based on the importing context.

## Decision

We adopt **Option 2**: the boundary is enforced by Next.js's module resolution of conditional package exports.

| Export condition | Next.js context                    | Accessible variables                   |
| :--------------- | :--------------------------------- | :------------------------------------- |
| `react-server`   | Server Components & Route Handlers | All variables (server, client, shared) |
| `default`        | Client Components (SSR & Browser)  | Public variables only (client, shared) |

1. **Bundler-resolved boundary.** The correct build is selected at bundle time by Next.js, not by ArkEnv at runtime. This is the same mechanism Next.js itself uses for `server-only` and `react-server` package semantics.
2. **Public-only client build.** The `default` build exposes only client and shared keys in its type surface and runtime proxy. Server-only keys are omitted from the generated `runtimeEnv` and from the client-resolved module.
3. **Full-schema server build.** The `react-server` build exposes the complete schema, so Server Components get full type inference and runtime access.
4. **Runtime proxy as a fail-safe.** Even if a developer imports the full `env` object into a Client Component (for example, in the flat layout where `env.ts` is a single file), the client-resolved build's proxy throws on access to server-only keys. The error surfaces during SSR, before the component reaches the browser.

## Consequences

- **Reliable isolation.** The boundary is fixed during bundling, so there is no `typeof window` ambiguity during SSR.
- **Zero user configuration.** Developers do not need to add `customConditions` or change `tsconfig.json`; Next.js resolves the exports automatically.
- **Dual build maintenance.** `@arkenv/nextjs` must ship and keep in sync two (or more) conditional builds. Changes to shared internals must be reflected across conditions.
- **Flat layout still leaks names and types.** Because the flat layout's `env.ts` is a single file imported into both server and client graphs, TypeScript sees the full schema everywhere. The conditional export boundary hides values, but variable names and types remain visible in the client bundle. Teams needing compile-time name/type hiding should use the strict layout.
- **Docs stay user-focused.** The exact export-condition table and module-resolution mechanics are recorded here rather than in user-facing documentation, keeping the security guide focused on guarantees rather than plumbing.
