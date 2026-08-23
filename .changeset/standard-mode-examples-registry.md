---
"arkenv": minor
---

#### Add `with-nextjs-standard` and `with-vite-react-standard` to example registry and scaffold defaults

Register the Next.js (`with-nextjs-standard`) and React + Vite (`with-vite-react-standard`) Standard Schema integration examples in the CLI example registry and scaffold defaults map:

```bash
# Bootstrap Next.js with Standard Mode and Zod
npx arkenv@latest init --example with-nextjs-standard my-next-app

# Bootstrap React + Vite with Standard Mode and Zod
npx arkenv@latest init --example with-vite-react-standard my-vite-app
```

- Add `with-nextjs-standard` and `with-vite-react-standard` to the bundled fallback example registry.
- Add scaffold `.env` defaults for `with-nextjs-standard` and `with-vite-react-standard`.
