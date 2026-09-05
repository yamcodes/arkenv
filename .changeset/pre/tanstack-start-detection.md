---
"arkenv": minor
---

#### Detect TanStack Start projects and recommend the Vite plugin

`arkenv init` now recognizes `@tanstack/react-start` and `@tanstack/start` in
project dependencies. TanStack Start projects are detected through the Vite
integration and scaffold `@arkenv/vite-plugin` with a `VITE_` client prefix,
matching plain Vite projects.
