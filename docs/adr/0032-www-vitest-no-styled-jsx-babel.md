# www Vitest does not compile Next styled-jsx

To keep `apps/www` jsdom tests on Vite without a Babel/`styled-jsx`
transform, so workspace `pnpm test` cannot hang on an `@babel/core` major
and tests stay silent without compiling CSS nobody asserts.

## Context & problem

www unit tests run under Vitest + Vite (`@vitejs/plugin-react`), not
`next build`. Next still ships `styled-jsx` into modules that tests can
pull in. Before this decision, `apps/www/vitest.config.ts` ran
`styled-jsx/babel` through `@rolldown/plugin-babel` on `@babel/core` 7 so
React would not warn about an unknown `jsx` prop on `<style>`.
`tests/setup.ts` then swallowed JSDOM “Could not parse CSS stylesheet”
noise from that compiled CSS.

Those tests assert behavior (roles, copy, a11y), not hashed `jsx-*`
classes (`docs/TESTING.md`). The compiler existed only for silence.

`styled-jsx/babel` is Babel 7-only. Compiling it on `@babel/core` 8 can
hang `pnpm test`. Pinning 7 forever taxes the CLI playground’s React
Compiler Babel stack (`apps/playgrounds/arkenv-cli`). Bringing
`@swc/plugin-styled-jsx` / `@vitejs/plugin-react-swc` back repeats
[#408](https://github.com/yamcodes/arkenv/issues/408).

Three layers compose. Mixing them into “Babel 8 vs remove the plugin” is
a false choice:

1. **A — styled-jsx in www Vitest:** compile it, stub internals, or never
   load it.
2. **B — `@babel/core` version policy:** pin 7 on www, split 7/8, or drop
   core from `www`.
3. **C — www unit-test toolchain:** Vitest+Vite, Next’s compiler in
   jsdom, or Playwright only.

## Directions considered

Complete answers are stacks (one pick per layer). This record is the
forward-port of `www-vitest-no-styled-jsx-babel` from `main`
([#1680](https://github.com/yamcodes/arkenv/pull/1680)).

- **C1 + A1 + B1 (left):** Vitest+Vite, keep `styled-jsx/babel`, pin
  `@babel/core` 7. Silent on 7. Hangs on 8. Compiles CSS the tests do not
  assert. Pins the playground unless we dual-version Babel.
- **C1 + A5 + B4 (rejected):** Drop Babel, `vi.mock("styled-jsx")` so
  Next/Fumadocs still render. Quiet if the mock matches Next’s exports.
  Breaks when the export shape moves. Do not use this as the silence
  strategy.
- **A3 / A4 (rejected):** SWC styled-jsx plugin, with or without
  `@vitejs/plugin-react-swc`. Same family we left in #408.
- **C3 (rejected):** Delete www jsdom tests; Playwright only. Out of
  scope; `docs/TESTING.md` still wants component tests.
- **C2 (deferred):** Force Next’s full compile graph into jsdom. Use if
  we later insist on unmocked layouts in Vitest. Playwright already
  covers real Next CSS.
- **A6 (rejected):** Drop the transform and live with unknown-`jsx`
  warnings.
- **C1 + C4 + B4 (chosen):** Vitest+Vite+Oxc plugin-react. Mock public
  `next/*` and Fumadocs APIs (or never import that chrome) so styled-jsx
  never loads. Remove www’s `@babel/core`, `@rolldown/plugin-babel`, and
  test-only `styled-jsx`. Playwright owns real Next CSS.

## Decision

1. **www Vitest stays Vitest + Vite + Oxc `@vitejs/plugin-react`.** Do
   not register `styled-jsx/babel` or `@rolldown/plugin-babel`.
2. **Silence by not loading styled-jsx.** Mock documented `next/*` and
   Fumadocs module APIs at the test boundary (same class as existing
   `next/navigation` / `fumadocs-ui/contexts/search` mocks). If a test
   cannot run without unmocked Next/Fumadocs chrome, move it to
   `apps/playwright-www`.
3. **Do not `vi.mock("styled-jsx")`** or stub styled-jsx internals.
4. **www does not depend on `@babel/core`, `@rolldown/plugin-babel`, or
   `styled-jsx` for tests.** `styled-jsx` may still resolve transitively
   via `next`.
5. **Playwright owns real Next CSS, layouts, and route-level a11y.**
   jsdom tests do not compile or assert CSS-in-JS.
6. **The CLI playground Babel graph is separate.** Do not edit playground
   files to close www’s styled-jsx work.

## Consequences

- Workspace Vitest no longer hangs because www compiled a Babel 7-only
  plugin on core 8.
- `apps/www/package.json.test.ts` guards the empty Babel/`styled-jsx`
  manifest. Re-adding those packages is the regression to catch.
- Future contributors who see unknown-`jsx` warnings should mock the
  public Next/Fumadocs import that pulled styled-jsx in, or move the test
  to Playwright. They should not add a compiler.
- #408 stays closed as a path: no SWC styled-jsx plugin in www Vitest.
