---
"arkenv": patch
"@arkenv/standard": patch
---

#### Drop default `z.coerce` from Zod product samples and scaffold templates

Update CLI Zod dialect templates and `@arkenv/standard` JSDoc examples to use `z.number()` instead of `z.coerce.number()`, aligning with ArkEnv's pre-coercion behavior on Standard Schema inputs.
