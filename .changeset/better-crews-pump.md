---
"arkenv": patch
---

#### Fix Standard Schema type inference

Fixed type inference when using `validator: "standard"` mode. The `env` object now correctly infers types from Standard Schema validators like Zod or Valibot.
