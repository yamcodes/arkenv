---
"arkenv": minor
---

#### Add `with-nextjs-zod` and `with-vite-react-zod` to example registry and scaffold defaults

Added Zod starter templates for Next.js (`with-nextjs-zod`) and React + Vite (`with-vite-react-zod`) to `arkenv init`:

```bash
# Bootstrap Next.js with Standard Mode and Zod
npx arkenv@latest init --example with-nextjs-zod my-next-app

# Bootstrap React + Vite with Standard Mode and Zod
npx arkenv@latest init --example with-vite-react-zod my-vite-app
```

- Added `with-nextjs-zod` and `with-vite-react-zod` to the bundled fallback example registry.
- Added scaffold `.env` defaults for `with-nextjs-zod` and `with-vite-react-zod`.
