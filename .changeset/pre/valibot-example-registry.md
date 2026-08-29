---
"arkenv": minor
---

#### Add `with-valibot` to the bundled example registry and scaffold defaults

Register the new standalone `with-valibot` example so it is offered alongside `with-zod` when scaffolding, including in the offline fallback registry used when the remote registry fetch fails.

- Add a `with-valibot` entry to the bundled fallback example registry.
- Add `with-valibot` env defaults (`HOST`, `PORT`, `NODE_ENV`) to the scaffold defaults map.
