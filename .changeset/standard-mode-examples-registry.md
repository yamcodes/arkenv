---
"arkenv": minor
---

#### Add `with-nextjs-standard` and `with-vite-react-standard` to example registry and scaffold defaults

Added Standard Schema starter templates for Next.js (`with-nextjs-standard`) and React + Vite (`with-vite-react-standard`) to `arkenv init`:

```bash
# Bootstrap Next.js with Standard Mode and Zod
npx arkenv@latest init --example with-nextjs-standard my-next-app

# Bootstrap React + Vite with Standard Mode and Zod
npx arkenv@latest init --example with-vite-react-standard my-vite-app
```

- Added `with-nextjs-standard` and `with-vite-react-standard` to the bundled fallback example registry.
- Added scaffold `.env` defaults for `with-nextjs-standard` and `with-vite-react-standard`.
