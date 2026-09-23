---
"@arkenv/nextjs": patch
---

#### Widen the React peer dependency range

Allow `@arkenv/nextjs` to work with React 18.2.0 and later in the React 18 line,
as well as every React 19 release, instead of requiring React 19.2.5. Install it
alongside a supported React version, such as `pnpm add @arkenv/nextjs react@^18.2.0`.
