---
"arkenv": minor
---

#### Add `with-nextjs-zod`, `with-vite-react-zod`, and `mix-and-match` to example registry and scaffold defaults

Added starter templates for Next.js (`with-nextjs-zod`), React + Vite (`with-vite-react-zod`), and mixed schema validation (`mix-and-match`) to `arkenv init`:

```bash
# Bootstrap Next.js with Standard Mode and Zod
npx arkenv@latest init --example with-nextjs-zod my-next-app

# Bootstrap React + Vite with Standard Mode and Zod
npx arkenv@latest init --example with-vite-react-zod my-vite-app

# Bootstrap Node.js with mixed ArkType, Zod, and Valibot
npx arkenv@latest init --example mix-and-match my-mixed-app
```

- Added `with-nextjs-zod`, `with-vite-react-zod`, and `mix-and-match` to the bundled fallback example registry.
- Added scaffold `.env` defaults for `with-nextjs-zod`, `with-vite-react-zod`, and `mix-and-match`.
