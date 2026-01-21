---
"arkenv": patch
---

#### Fix Standard Schema type inference

Fixed type inference when using `validator: "standard"` mode. The `env` object now correctly infers types from Standard Schema validators (Zod, Valibot, etc.) instead of wrapping them in ArkType-specific types like `distill.Out`.
