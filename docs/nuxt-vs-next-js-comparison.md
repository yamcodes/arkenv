# Nuxt vs. Next.js Integration Comparison

This document provides a technical comparison of the **Nuxt** vs. **Next.js** integrations for ArkEnv.

---

## 1. Developer Setup & Configuration (Ease of Use)

- **Next.js**:
  - **Integration Method:** Wrapped configuration. Users must import `withArkEnv` in `next.config.js` and wrap their default export config object:
    ```ts
    import { withArkEnv } from "@arkenv/nextjs/config";
    export default withArkEnv(nextConfig);
    ```
  - **DX Friction:** Wrapping configurations can feel intrusive, and if not done correctly, can break during more complex config compositions (like Next.js plugins).
- **Nuxt**:
  - **Integration Method:** Native Nuxt Module. Users register `@arkenv/nuxt/module` inside their `nuxt.config.ts` modules array:
    ```ts
    export default defineNuxtConfig({
        modules: ["@arkenv/nuxt/module"]
    });
    ```
  - **DX Friction:** Virtually zero. Adding modules is the standard, idiomatic way to extend Nuxt apps. The CLI wizard automatically appends this module to the config array.
- *🏆 **Winner:** **Nuxt** is cleaner and feels more native.*

---

## 2. Runtime Environment Variable Sourcing (Runtime Features)

- **Next.js**:
  - **Mechanism:** Statically inlines `process.env.NEXT_PUBLIC_*` at build time.
  - **Limitation:** Client-side environment variables cannot be modified dynamically at runtime (e.g., changing API endpoints in Docker containers/deployment environments without rebuilding).
- **Nuxt**:
  - **Mechanism:** Uses Nuxt's built-in **Runtime Config System** (`runtimeConfig`).
  - The `@arkenv/nuxt` module automatically registers server keys under private runtime config, and client/shared keys under public runtime config (`runtimeConfig.public`).
  - The generated factory imports and calls `useRuntimeConfig()` under the hood:
    ```ts
    NUXT_PUBLIC_API_URL: config?.public?.NUXT_PUBLIC_API_URL ?? process.env.NUXT_PUBLIC_API_URL,
    ```
  - **DX Benefit:** This allows developers to change public environment variables **at runtime** without rebuilds, which is a major Next.js pain point.
- *🏆 **Winner:** **Nuxt** is significantly better due to runtime config support.*

---

## 3. Client-Side Security (Prevention of Server Env Leaks)

- **Next.js**:
  - **Mechanism:** Relies on the React `server-only` package at the entry-point level (`packages/nextjs/src/server.ts`). If imported on the client side, the Next.js bundler throws a compile-time error.
- **Nuxt**:
  - **Mechanism:** Since Nuxt is framework-agnostic and React's `server-only` is not standard, it injects a **custom Vite plugin** (`vite:extendConfig` hook in the module) to intercept client-side imports.
  - It detects imports of `@arkenv/nuxt/server` and raises a compilation error directly:
    ```ts
    throw new Error("[ArkEnv] Importing server-only environment schema on the client is not allowed!");
    ```
- *🏆 **Winner:** **Tie.** Next.js relies on an ecosystem standard (`server-only`), while Nuxt implements a robust custom compiler check via Vite. Both utilize the same runtime JS Proxy to safeguard against key leaks.*

---

## 4. Code Quality & Boilerplate

- **Next.js**:
  - The config helper (`config.ts`) is **892 lines** and has to manually check Next.js phases (`process.env.NEXT_PHASE`) to determine server state and watchers.
- **Nuxt**:
  - The config helper is **700 lines** because all framework integration hooks (watcher setup, logger, config updates) are cleanly delegated to the official Nuxt Module definition in `module.ts` using `@nuxt/kit`.
- *🏆 **Winner:** **Nuxt** has a cleaner, more modular architecture.*

---

## 5. Testing

- **Next.js**:
  - Extensively tested. Has **4 test files** (`config.test.ts` with 24 tests, `index.test.ts` with 9 tests, `separate-files.test.ts` with 11 tests, and `server-only.test.ts`).
  - Tests verify deep edge cases, watcher lifecycles, and type regression.
- **Nuxt**:
  - Tests are present but basic. Contains **3 test files** (`config.test.ts` with 5 tests, `index.test.ts` with 6 tests, and `module.test.ts` with 1 test).
  - No typescript compilation tests (`.test-d.ts`) or deep watcher/separate files coverage.
- *🏆 **Winner:** **Next.js** is tested significantly better.*

---

## 6. Documentation

- **Next.js**:
  - First-class documentation. Has a detailed README in the package folder, and multiple dedicated MDX guides in the main documentation site under `apps/www/content/docs/nextjs/` (covering strict layouts, custom validators, and layouts).
- **Nuxt**:
  - **Currently Undocumented.** There is no `README.md` in `packages/nuxt/` and no Nuxt integration folder or guides on the main documentation site. It is only briefly mentioned in the Comparison table and FAQ page updates.
- *🏆 **Winner:** **Next.js** is documented significantly better.*

---

## Summary Table

| Feature / Axis           |             Next.js            |                  Nuxt                 |    Winner   |
| :----------------------- | :----------------------------: | :-----------------------------------: | :---------: |
| **Developer Setup**      |     Wrapping (`withArkEnv`)    | Native Module (`@arkenv/nuxt/module`) |   **Nuxt**  |
| **Runtime Env Config**   |  Static (build-time inlining)  | Dynamic (runtime config swap support) |   **Nuxt**  |
| **Client Leak Security** |      `server-only` package     |      Custom Vite Resolver Plugin      |   **Tie**   |
| **Code Architecture**    |   Imperative lifecycle hacks   |      Clean Nuxt Kit module hooks      |   **Nuxt**  |
| **Test Quality**         | Extremely thorough (36+ tests) |            Basic (12 tests)           | **Next.js** |
| **Documentation**        |    Dedicated guides & README   |        No README or docs pages        | **Next.js** |

---

## Recommendations for the PR

1. **Write Nuxt Docs:** A dedicated page or guide for Nuxt needs to be added (similar to `docs/nextjs`) to document setup, module options, and how it handles runtime config.
2. **Add package README:** Add a `packages/nuxt/README.md` to help developers searching NPM.
3. **Enhance Module tests:** Add tests for edge cases like when `useRuntimeConfig` throws, and verify client security Vite plugin behavior under test.
